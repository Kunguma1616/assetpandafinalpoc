#!/usr/bin/env python3
# Full Flask server with robust Salesforce user lookup & mapping logic
# Save as app.py

import os
import base64
import json
import logging
import re
from datetime import datetime
from io import BytesIO

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# Optional external libraries — import safely so server can run for debugging without them installed
HAS_GROQ = False
HAS_REPORTLAB = False
Groq = None
RLImage = None
try:
    from groq import Groq
    HAS_GROQ = True
except Exception:
    logging.warning("⚠️ Groq library not available — image analysis endpoints will be disabled.")

try:
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    HAS_REPORTLAB = True
except Exception:
    logging.warning("⚠️ reportlab not available — PDF generation features will be disabled.")

# Salesforce imports
from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceAuthenticationFailed, SalesforceGeneralError

from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

# Load API Key
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
if not GROQ_API_KEY:
    logging.info("ℹ️ GROQ_API_KEY not set — image analysis features will be disabled for local debug.")

# =====================================================
# LOCAL STORAGE PATH
# =====================================================
ASSETS_FILE = os.getenv("ASSETS_FILE", "assets_storage.json")
ASSET_HISTORY_FILE = os.getenv("ASSET_HISTORY_FILE", "asset_history.json")
COMPANY_STORAGE_LOCATION = os.getenv("COMPANY_STORAGE_LOCATION", "Warehouse Warehouse")

# =====================================================
# OPTIONAL: Default Account ID for Assets without customer
# =====================================================
DEFAULT_ASSET_ACCOUNT_ID = os.getenv("DEFAULT_ASSET_ACCOUNT_ID", "").strip()
DEFAULT_ASSET_USER_ID = os.getenv("DEFAULT_ASSET_USER_ID", "").strip()  # If set, should be "005..."
DEFAULT_ASSET_USER_NAME = os.getenv("DEFAULT_ASSET_USER_NAME", "Warehouse Warehouse")

# Optional overrides to improve mapping in custom orgs
PREFERRED_USER_LOOKUP = os.getenv("PREFERRED_USER_LOOKUP", "").strip()  # e.g. Technician__c
FORCE_DEFAULT_USER = os.getenv("FORCE_DEFAULT_USER", "false").lower() in ("1", "true", "yes")
WRITE_BOTH_LOOKUPS = os.getenv("WRITE_BOTH_LOOKUPS", "false").lower() in ("1", "true", "yes")

# =====================================================
# SALESFORCE CONNECTION
# =====================================================
def get_salesforce_connection():
    """
    Connect to Salesforce using credentials from .env
    """
    try:
        sf = Salesforce(
            username=os.getenv("SF_USERNAME"),
            password=os.getenv("SF_PASSWORD"),
            security_token=os.getenv("SF_SECURITY_TOKEN"),
            domain=os.getenv("SF_DOMAIN", "login")
        )
        logging.info("✅ Salesforce connection successful")
        return sf
    except SalesforceAuthenticationFailed as e:
        logging.error(f"❌ Salesforce authentication failed: {e}")
        return None
    except Exception as e:
        logging.error(f"❌ Salesforce connection failed: {e}")
        return None


# =====================================================
# HELPERS: File storage and encoding
# =====================================================
def load_assets_from_file():
    if not os.path.exists(ASSETS_FILE):
        return []
    try:
        with open(ASSETS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Error loading assets: {e}")
        return []


def save_assets_to_file(assets):
    try:
        with open(ASSETS_FILE, 'w') as f:
            json.dump(assets, f, indent=2)
        return True
    except Exception as e:
        logging.error(f"Error saving assets: {e}")
        return False


def load_asset_history():
    if not os.path.exists(ASSET_HISTORY_FILE):
        return []
    try:
        with open(ASSET_HISTORY_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Error loading asset history: {e}")
        return []


def save_asset_history(history):
    try:
        with open(ASSET_HISTORY_FILE, "w") as f:
            json.dump(history, f, indent=2)
        return True
    except Exception as e:
        logging.error(f"Error saving asset history: {e}")
        return False


def encode_image_to_base64(uploaded_file):
    uploaded_file.seek(0)
    data = uploaded_file.read()
    return base64.b64encode(data).decode("utf-8"), data


# =====================================================
# ASSET METADATA (Groq optional)
# =====================================================
def get_asset_metadata(base64_image, mime_type, api_key):
    if not HAS_GROQ:
        logging.info("ℹ️ Groq not available — returning fallback metadata")
        return {
            "AssetName": "Unknown Asset",
            "Manufacturer": "Unknown",
            "ModelNumber": "Unknown",
            "Condition": "unknown",
            "Category": "Unknown",
            "VisualDescription": "Image analysis unavailable",
            "DetailedDescription": "Image analysis not available on this server."
        }

    client = Groq(api_key=api_key)

    prompt = """
You are an expert industrial asset analyzer for inventory management.
Analyze this image carefully and extract detailed asset information.

Return ONLY valid JSON with these exact fields:
{
  "AssetName": "descriptive name of the asset",
  "Manufacturer": "brand or manufacturer name (if visible, look carefully for any text/logos)",
  "ModelNumber": "model number or identifier (if visible)",
  "Condition": "excellent/good/fair/poor based on visual inspection",
  "Category": "type of asset (e.g., Ladder, Pump, Valve, Motor, Tools, Safety Equipment, Dehumidifier, etc.)",
  "VisualDescription": "detailed physical description including color, size, material, distinctive features, visible wear, any labels or markings, approximate dimensions, and any other relevant details you can observe",
  "DetailedDescription": "A comprehensive 3-4 paragraph description covering: 1) What this asset is and its primary purpose/function, 2) Key specifications, features, and capabilities, 3) Current condition assessment with specific details about wear, maintenance needs, or notable characteristics, 4) Recommended use cases, safety considerations, or operational notes"
}
"""

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}
                    }
                ]
            }
        ],
        temperature=0.3,
        max_tokens=2000
    )

    try:
        # some Groq responses may already be a dict; handle both
        content = response.choices[0].message.content
        if isinstance(content, dict):
            return content
        return json.loads(content)
    except Exception as e:
        logging.error(f"Groq JSON parsing error: {e}")
        logging.error(f"Response was: {response.choices[0].message.content}")
        return {
            "AssetName": "Unknown Asset",
            "Manufacturer": "Unknown",
            "ModelNumber": "Unknown",
            "Condition": "unknown",
            "Category": "Unknown",
            "VisualDescription": "Failed to analyze asset",
            "DetailedDescription": "Unable to generate detailed description for this asset."
        }


# =====================================================
# CORE: create_asset_record with robust user mapping
# =====================================================
def create_asset_record(asset_name,
                        asset_type_id,
                        account_id=None,
                        contact_id=None,
                        asset_description=None,
                        serial_number=None,
                        purchase_date=None,
                        price=None,
                        user_value=None):
    """
    Creates an Asset record in Salesforce.
    Ensures robust mapping of a user/owner lookup:
      - Uses PREFERRED_USER_LOOKUP if configured and present in org
      - Tries to resolve user_value (email / name / partial)
      - Falls back to DEFAULT_ASSET_USER_ID if provided or to a text field/Description
      - Optionally forces default user if FORCE_DEFAULT_USER is true
      - Optionally writes both OwnerId and custom lookup when WRITE_BOTH_LOOKUPS is true
    """
    sf = get_salesforce_connection()
    if sf is None:
        return {"success": False, "error": "Salesforce connection missing", "skipped": False}

    # Require AccountId or ContactId — fallback to configured default
    if not account_id and not contact_id:
        if DEFAULT_ASSET_ACCOUNT_ID:
            logging.info(f"ℹ️ No Account/Contact provided - using DEFAULT_ASSET_ACCOUNT_ID: {DEFAULT_ASSET_ACCOUNT_ID}")
            account_id = DEFAULT_ASSET_ACCOUNT_ID
        else:
            msg = ("Salesforce requires either an AccountId or ContactId for every Asset. "
                   "Provide account_id/contact_id or set DEFAULT_ASSET_ACCOUNT_ID in .env")
            logging.warning("⚠️ " + msg)
            return {"success": False, "error": msg, "skipped": True}

    try:
        asset_data = {"Name": asset_name}
        if asset_description:
            asset_data["Description"] = asset_description[:32000]

        if asset_type_id and isinstance(asset_type_id, str) and len(asset_type_id) >= 15:
            asset_data["Asset_Type__c"] = asset_type_id
        else:
            logging.warning("⚠️ Asset_Type__c missing or invalid; Salesforce may reject creation if required in org.")

        if serial_number:
            asset_data["SerialNumber"] = serial_number
        if purchase_date:
            asset_data["PurchaseDate"] = purchase_date
        if price:
            try:
                asset_data["Price__c"] = float(price)
            except Exception:
                asset_data["Price__c"] = price

        if account_id and account_id.startswith("001"):
            asset_data["AccountId"] = account_id
        if contact_id and contact_id.startswith("003"):
            asset_data["ContactId"] = contact_id

        # If caller gave a Salesforce user Id, prefer to set OwnerId now (we may set lookup too later)
        if user_value and isinstance(user_value, str) and user_value.startswith("005"):
            asset_data["OwnerId"] = user_value
            logging.info("✅ OwnerId pre-set from provided Salesforce user id")

        logging.info(f"📤 Initial asset payload: keys={list(asset_data.keys())}")

        # Describe Asset object to determine valid fields and candidate lookup field(s)
        try:
            desc = sf.Asset.describe()
            fields = desc.get("fields", [])
            valid_fields = {f["name"] for f in fields}
            field_map = {f["name"]: f for f in fields}

            # Determine candidate lookup field to User
            def find_user_lookup_field():
                # 1) If preferred explicit API name configured
                if PREFERRED_USER_LOOKUP:
                    if PREFERRED_USER_LOOKUP in field_map and field_map[PREFERRED_USER_LOOKUP].get("type") == "reference":
                        logging.info(f"ℹ️ Using PREFERRED_USER_LOOKUP: {PREFERRED_USER_LOOKUP}")
                        return PREFERRED_USER_LOOKUP
                    else:
                        logging.warning(f"⚠️ PREFERRED_USER_LOOKUP={PREFERRED_USER_LOOKUP} not present or not a reference on this org; ignoring")

                # 2) Common candidate names
                for candidate in ("User__c", "Assigned_User__c", "Assigned_To__c", "Technician__c", "Engineer__c"):
                    if candidate in field_map and field_map[candidate].get("type") == "reference":
                        return candidate

                # 3) Any reference field whose referenceTo points to User
                for fname, meta in field_map.items():
                    try:
                        if meta.get("type") == "reference":
                            refs = meta.get("referenceTo") or meta.get("reference_to") or []
                            if isinstance(refs, str):
                                refs = [refs]
                            for r in refs:
                                if r and str(r).lower() == "user":
                                    return fname
                    except Exception:
                        continue

                # 4) Labels containing engineer/assigned/user/technician
                for fname, meta in field_map.items():
                    try:
                        label = (meta.get("label") or "").lower()
                        if meta.get("type") == "reference" and any(k in label for k in ("engineer", "assigned", "user", "technician")):
                            return fname
                    except Exception:
                        continue

                # 5) OwnerId fallback
                if "OwnerId" in field_map:
                    return "OwnerId"
                return None

            candidate_field = find_user_lookup_field()
            logging.info(f"ℹ️ Candidate user lookup field: {candidate_field}")

            # Resolve user_value (attempt to return Salesforce User Id)
            def resolve_user_id(value):
                attempts = []
                if not value:
                    return None, attempts

                # If already an Id
                if isinstance(value, str) and value.startswith("005"):
                    attempts.append({"method": "provided_id", "id": value})
                    return value, attempts

                clean = re.sub(r"\s*\(.*\)$", "", value).strip()
                soql_clean = clean.replace("'", "\\'")

                # Try email if it looks like an email
                if "@" in value and "." in value:
                    soql = f"SELECT Id, Name, Email FROM User WHERE Email = '{soql_clean}' LIMIT 1"
                    attempts.append({"method": "email", "soql": soql})
                    try:
                        q = sf.query(soql)
                        if q and q.get("records"):
                            attempts.append({"result": "found_by_email", "record": q["records"][0]})
                            return q["records"][0]["Id"], attempts
                    except Exception as e:
                        attempts.append({"error": str(e)})

                # Exact full name
                soql = f"SELECT Id, Name FROM User WHERE Name = '{soql_clean}' LIMIT 1"
                attempts.append({"method": "name_exact", "soql": soql})
                try:
                    q = sf.query(soql)
                    if q and q.get("records"):
                        attempts.append({"result": "found_by_name_exact", "record": q["records"][0]})
                        return q["records"][0]["Id"], attempts
                except Exception as e:
                    attempts.append({"error": str(e)})

                # LIKE name
                soql = f"SELECT Id, Name FROM User WHERE Name LIKE '%{soql_clean}%' LIMIT 1"
                attempts.append({"method": "name_like", "soql": soql})
                try:
                    q = sf.query(soql)
                    if q and q.get("records"):
                        attempts.append({"result": "found_by_name_like", "record": q["records"][0]})
                        return q["records"][0]["Id"], attempts
                except Exception as e:
                    attempts.append({"error": str(e)})

                # First + Last
                try:
                    tokens = clean.split()
                    if len(tokens) >= 2:
                        first = tokens[0].replace("'", "\\'")
                        last = tokens[-1].replace("'", "\\'")
                        soql = f"SELECT Id, Name FROM User WHERE FirstName = '{first}' AND LastName = '{last}' LIMIT 1"
                        attempts.append({"method": "first_last", "soql": soql})
                        try:
                            q = sf.query(soql)
                            if q and q.get("records"):
                                attempts.append({"result": "found_by_first_last", "record": q["records"][0]})
                                return q["records"][0]["Id"], attempts
                        except Exception as e:
                            attempts.append({"error": str(e)})

                    if len(tokens) > 0:
                        last = tokens[-1].replace("'", "\\'")
                        soql = f"SELECT Id, Name FROM User WHERE LastName = '{last}' LIMIT 1"
                        attempts.append({"method": "last_exact", "soql": soql})
                        try:
                            q = sf.query(soql)
                            if q and q.get("records"):
                                attempts.append({"result": "found_by_last_exact", "record": q["records"][0]})
                                return q["records"][0]["Id"], attempts
                        except Exception as e:
                            attempts.append({"error": str(e)})

                        soql = f"SELECT Id, Name FROM User WHERE LastName LIKE '%{last}%' LIMIT 1"
                        attempts.append({"method": "last_like", "soql": soql})
                        try:
                            q = sf.query(soql)
                            if q and q.get("records"):
                                attempts.append({"result": "found_by_last_like", "record": q["records"][0]})
                                return q["records"][0]["Id"], attempts
                        except Exception as e:
                            attempts.append({"error": str(e)})
                except Exception as e:
                    attempts.append({"error": str(e)})

                return None, attempts

            # Decide on mapped user id
            mapped_user_id = None
            map_attempts = []

            # If FORCE_DEFAULT_USER: use DEFAULT_ASSET_USER_ID immediately if set
            if FORCE_DEFAULT_USER and DEFAULT_ASSET_USER_ID:
                mapped_user_id = DEFAULT_ASSET_USER_ID
                map_attempts.append({"method": "force_default", "value": DEFAULT_ASSET_USER_ID})
                logging.info("ℹ️ FORCE_DEFAULT_USER active; using DEFAULT_ASSET_USER_ID")

            # If user_value provided and is Salesforce Id, prefer it
            if not mapped_user_id and user_value and isinstance(user_value, str) and user_value.startswith("005"):
                mapped_user_id = user_value
                map_attempts.append({"method": "provided_id", "value": user_value})

            # Else attempt to resolve user_value to an Id
            if not mapped_user_id and user_value:
                uid, attempts = resolve_user_id(user_value)
                map_attempts.extend(attempts)
                if uid:
                    mapped_user_id = uid

            # If still not mapped and DEFAULT_ASSET_USER_ID provided, use as fallback
            if not mapped_user_id and DEFAULT_ASSET_USER_ID:
                mapped_user_id = DEFAULT_ASSET_USER_ID
                map_attempts.append({"method": "fallback_default_user", "value": DEFAULT_ASSET_USER_ID})

            logging.info(f"ℹ️ User mapping attempts: {map_attempts}")

            # Apply mapping
            if mapped_user_id:
                # If candidate_field exists and is reference & present in org, set it
                if candidate_field and candidate_field in valid_fields:
                    # Candidate field could be OwnerId or a custom lookup
                    asset_data[candidate_field] = mapped_user_id
                    logging.info(f"✅ Setting {candidate_field} = {mapped_user_id}")
                    # optionally also set OwnerId if requested and present
                    if WRITE_BOTH_LOOKUPS and "OwnerId" in valid_fields:
                        asset_data["OwnerId"] = mapped_user_id
                        logging.info("✅ WRITE_BOTH_LOOKUPS enabled: also set OwnerId")
                # Candidate not present but OwnerId present: set OwnerId
                elif "OwnerId" in valid_fields:
                    asset_data["OwnerId"] = mapped_user_id
                    logging.info(f"✅ Setting OwnerId = {mapped_user_id}")
                else:
                    # No suitable lookup field — set to fallback text fields if present or append to Description
                    for fb in ("Assigned_User__c", "User_Name__c", "User_Text__c"):
                        if fb in valid_fields:
                            asset_data[fb] = DEFAULT_ASSET_USER_NAME or user_value or "Assigned User"
                            logging.info(f"✅ Setting fallback text field {fb} to user display")
                            break
                    else:
                        # Append to Description
                        asset_data["Description"] = (asset_data.get("Description", "") + f"\nAssigned User: {DEFAULT_ASSET_USER_NAME or user_value or 'Assigned User'}").strip()
                        logging.info("ℹ️ Appended Assigned User to Description (final fallback)")
            else:
                logging.info("ℹ️ No user mapping resolved and no default configured; asset will be created without user/owner set.")

            # Filter out invalid keys that aren't fields on Asset sobject to avoid API errors
            invalid_keys = [k for k in list(asset_data.keys()) if k not in valid_fields]
            if invalid_keys:
                logging.debug(f"Removing unknown fields not present on Asset sobject: {invalid_keys}")
                for k in invalid_keys:
                    asset_data.pop(k, None)
        except Exception as e:
            logging.warning(f"⚠️ Could not describe Asset fields or map user due to: {e} — proceeding with available fields")

        # Attempt to create Asset
        try:
            result = sf.Asset.create(asset_data)
            logging.info(f"✅ Salesforce Asset created: {result}")
            return {"success": True, "result": result, "skipped": False}
        except SalesforceGeneralError as e:
            logging.error(f"❌ SalesforceGeneralError during create: {e}")
            return {"success": False, "error": str(e), "skipped": False}
        except Exception as e:
            logging.error(f"❌ Unexpected error creating Asset: {e}")
            return {"success": False, "error": str(e), "skipped": False}
    except Exception as e:
        logging.error(f"❌ Unexpected error in create_asset_record: {e}")
        return {"success": False, "error": str(e), "skipped": False}


# =====================================================
# PDF REPORT FUNCTION (unchanged functional behavior)
# =====================================================
def create_engineer_pdf_report(engineer_name, engineer_category, assets_data, logo_bytes):
    if not HAS_REPORTLAB:
        logging.warning("⚠️ reportlab not available — PDF report generation skipped")
        return None

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)

    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#27549D'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=12
    )

    heading_style = ParagraphStyle(
        'AssetHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#27549D'),
        fontName='Helvetica-Bold',
        spaceAfter=8
    )

    desc_style = ParagraphStyle(
        'Description',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_LEFT,
        leading=14,
        spaceAfter=8
    )

    if logo_bytes:
        try:
            logo_img = RLImage(BytesIO(logo_bytes), width=1.2 * inch, height=1.2 * inch)
            logo_img.hAlign = 'CENTER'
            story.append(logo_img)
            story.append(Spacer(1, 0.2 * inch))
        except Exception as e:
            logging.warning(f"Logo error: {e}")

    story.append(Paragraph("ASSET INVENTORY REPORT", title_style))
    story.append(Spacer(1, 0.2 * inch))

    info_data = [
        ["Engineer Name:", engineer_name],
        ["Category:", engineer_category],
        ["Total Assets:", str(len(assets_data))],
        ["Report Date:", datetime.now().strftime("%B %d, %Y")]
    ]

    info_table = Table(info_data, colWidths=[150, 350])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#27549D")),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(info_table)
    story.append(PageBreak())

    for idx, asset in enumerate(assets_data, 1):
        asset_name = asset.get('filename', f"Asset {idx}")
        story.append(Paragraph(f"Asset #{idx}: {asset_name}", heading_style))
        story.append(Spacer(1, 0.15 * inch))

        try:
            img_bytes = base64.b64decode(asset["image_base64"])
            img = RLImage(BytesIO(img_bytes), width=4 * inch, height=3 * inch)
            img.hAlign = 'CENTER'
            story.append(img)
            story.append(Spacer(1, 0.2 * inch))
        except Exception:
            story.append(Paragraph("Image unavailable", styles["Normal"]))
            story.append(Spacer(1, 0.1 * inch))

        metadata = asset.get("metadata", {})
        meta_rows = []
        fields_order = [
            ("Manufacturer", "Manufacturer"),
            ("Model", "Model"),
            ("Condition", "Condition"),
            ("Category", "Category")
        ]
        for label, key in fields_order:
            value = metadata.get(key, "N/A")
            if value and value != "N/A" and value != "None":
                meta_rows.append([label, str(value)])
        if meta_rows:
            meta_table = Table(meta_rows, colWidths=[120, 380])
            meta_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#E8F0FE")),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(meta_table)
            story.append(Spacer(1, 0.15 * inch))

        detailed_description = metadata.get("DetailedDescription", "")
        if detailed_description:
            story.append(Paragraph("<b>Detailed Description:</b>", styles["Normal"]))
            story.append(Spacer(1, 0.08 * inch))
            story.append(Paragraph(detailed_description, desc_style))
            story.append(Spacer(1, 0.1 * inch))

        visual_description = metadata.get("Description", "")
        if visual_description and visual_description != "No description available":
            story.append(Paragraph("<b>Visual Inspection Notes:</b>", styles["Normal"]))
            story.append(Spacer(1, 0.05 * inch))
            story.append(Paragraph(visual_description, desc_style))

        if idx != len(assets_data):
            story.append(PageBreak())

    doc.build(story)
    buffer.seek(0)
    return buffer


# =====================================================
# FLASK SERVER & ENDPOINTS
# =====================================================
app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/get-asset-types", methods=["GET"])
def get_asset_types():
    try:
        sf = get_salesforce_connection()
        if sf is None:
            return jsonify({'success': False, 'error': 'Salesforce connection failed', 'asset_types': []}), 500
        result = sf.query("SELECT Id, Name FROM Asset_Type__c ORDER BY Name")
        asset_types = [{'id': r['Id'], 'name': r['Name']} for r in result.get('records', [])]
        logging.info(f"Fetched {len(asset_types)} Asset Types")
        return jsonify({'success': True, 'asset_types': asset_types})
    except Exception as e:
        logging.error(f"Error fetching asset types: {e}")
        return jsonify({'success': False, 'error': str(e), 'asset_types': []}), 500


@app.route("/create-asset-type", methods=["POST"])
def create_asset_type():
    try:
        data = request.get_json() or {}
        name = data.get('name')
        if not name:
            return jsonify({'success': False, 'error': 'Missing name'}), 400
        sf = get_salesforce_connection()
        if sf is None:
            return jsonify({'success': False, 'error': 'Salesforce connection failed'}), 500
        result = sf.Asset_Type__c.create({'Name': name})
        if result and result.get('id'):
            return jsonify({'success': True, 'id': result.get('id'), 'name': name})
        return jsonify({'success': False, 'error': 'Salesforce did not return id'}), 500
    except Exception as e:
        logging.error(f"Error creating asset type: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route("/upload-image", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image = request.files["image"]
    engineer_name = request.form.get("engineer_name", "Unknown")
    engineer_id = request.form.get("engineer_id", "")
    account_id = request.form.get("account_id", "")
    contact_id = request.form.get("contact_id", "")
    category = request.form.get("category", "general")
    asset_price = request.form.get("asset_price", "0")
    asset_type = request.form.get("asset_type", "")  # Asset Type ID
    asset_id = request.form.get("asset_id", "")
    asset_name = request.form.get("asset_name", "")
    asset_number = request.form.get("asset_number", "")
    serial_number = request.form.get("serial_number", "")
    purchase_date = request.form.get("purchase_date", "")

    logging.info(f"Received upload: engineer='{engineer_name}' engineer_id='{engineer_id}' asset_type='{asset_type}'")

    base64_str, img_bytes = encode_image_to_base64(image)

    try:
        raw_metadata = get_asset_metadata(base64_str, image.content_type, GROQ_API_KEY)

        assets = load_assets_from_file()
        existing_ids = [a.get("id", 0) for a in assets]
        new_id = max(existing_ids) + 1 if existing_ids else 1

        final_asset_name = asset_name if asset_name else raw_metadata.get("AssetName", "Unnamed Asset")
        manufacturer = raw_metadata.get("Manufacturer") or "Unknown"
        model_number = raw_metadata.get("ModelNumber") or "Unknown"
        condition = raw_metadata.get("Condition") or "unknown"

        new_asset = {
            "id": new_id,
            "filename": image.filename,
            "engineer_name": engineer_name,
            "engineer_id": engineer_id,
            "engineer_category": category,
            "asset_id": asset_id,
            "asset_name": final_asset_name,
            "asset_number": asset_number,
            "serial_number": serial_number,
            "purchase_date": purchase_date,
            "asset_type": asset_type,
            "asset_price": asset_price,
            "manufacturer": manufacturer,
            "model_number": model_number,
            "condition": condition,
            "visual_description": raw_metadata.get("VisualDescription") or "No description",
            "detailed_description": raw_metadata.get("DetailedDescription") or "No detailed description available.",
            "category": raw_metadata.get("Category") or category,
            "image_base64": base64_str,
            "raw_metadata": raw_metadata,
            "stored_location": COMPANY_STORAGE_LOCATION,
            "uploaded_at": datetime.now().isoformat()
        }

        valid_account_id = account_id if account_id and account_id.startswith("001") else None
        valid_contact_id = contact_id if contact_id and contact_id.startswith("003") else None

        # Prepare user_value: prefer explicit SF id (005...), otherwise use name/email provided
        user_value = engineer_id if engineer_id and engineer_id.startswith("005") else engineer_name

        sf_result = create_asset_record(
            asset_name=final_asset_name,
            asset_type_id=asset_type,
            account_id=valid_account_id,
            contact_id=valid_contact_id,
            asset_description=new_asset.get("detailed_description"),
            serial_number=serial_number,
            purchase_date=purchase_date,
            price=asset_price,
            user_value=user_value
        )

        if sf_result.get("success"):
            logging.info("Salesforce asset created successfully")
            new_asset["salesforce_id"] = sf_result["result"].get("id")
            new_asset["salesforce_status"] = "created"
        elif sf_result.get("skipped"):
            logging.warning("Salesforce creation skipped")
            new_asset["salesforce_status"] = "skipped"
            new_asset["salesforce_error"] = sf_result.get("error")
        else:
            logging.warning("Salesforce creation failed")
            new_asset["salesforce_status"] = "failed"
            new_asset["salesforce_error"] = sf_result.get("error")

        assets.append(new_asset)

        history = load_asset_history()
        history_entry = {
            "id": f"HIST-{len(history) + 1}",
            "asset_id": new_id,
            "asset_name": new_asset["asset_name"],
            "asset_code": f"AST-{str(new_id).zfill(4)}",
            "field": "stored_location",
            "old_value": "—",
            "new_value": COMPANY_STORAGE_LOCATION,
            "created_at": datetime.now().isoformat()
        }
        history.append(history_entry)
        save_asset_history(history)

        if save_assets_to_file(assets):
            logging.info(f"Asset saved locally with ID {new_id}")
            return jsonify({
                "success": True,
                "message": "Asset saved successfully",
                "asset": new_asset,
                "salesforce_status": new_asset.get("salesforce_status", "unknown"),
                "salesforce_id": new_asset.get("salesforce_id"),
                "salesforce_error": new_asset.get("salesforce_error")
            })
        else:
            return jsonify({"error": "Failed to save asset locally"}), 500

    except Exception as e:
        logging.exception("Upload error")
        return jsonify({"error": "Processing failed", "details": str(e)}), 500


@app.route("/assets", methods=["GET"])
def get_assets():
    try:
        return jsonify(load_assets_from_file())
    except Exception as e:
        logging.error(f"Error loading assets: {e}")
        return jsonify({"error": "Failed to load assets"}), 500


@app.route("/assets/<int:asset_id>", methods=["GET"])
def get_single_asset(asset_id):
    try:
        assets = load_assets_from_file()
        asset = next((a for a in assets if a.get("id") == asset_id), None)
        if asset:
            return jsonify(asset)
        return jsonify({"error": "Asset not found"}), 404
    except Exception as e:
        logging.error(e)
        return jsonify({"error": "Failed to load asset"}), 500


@app.route("/assets/<int:asset_id>", methods=["PUT"])
def update_asset(asset_id):
    try:
        assets = load_assets_from_file()
        asset = next((a for a in assets if a.get("id") == asset_id), None)
        if not asset:
            return jsonify({"error": "Asset not found"}), 404
        data = request.get_json() or {}
        updatable = ["asset_name", "asset_type", "asset_price", "manufacturer", "model_number",
                     "condition", "category", "visual_description", "detailed_description"]
        for key in updatable:
            if key in data:
                asset[key] = data[key]
        asset["updated_at"] = datetime.now().isoformat()
        if save_assets_to_file(assets):
            return jsonify({"success": True, "message": "Asset updated", "asset": asset})
        return jsonify({"error": "Failed to update asset"}), 500
    except Exception as e:
        logging.exception("Update error")
        return jsonify({"error": "Failed to update asset"}), 500


@app.route("/assets/<int:asset_id>", methods=["DELETE"])
def delete_asset(asset_id):
    try:
        assets = load_assets_from_file()
        original_count = len(assets)
        assets = [a for a in assets if a.get("id") != asset_id]
        if len(assets) == original_count:
            return jsonify({"error": "Asset not found"}), 404
        if save_assets_to_file(assets):
            return jsonify({"success": True, "message": "Asset deleted"})
        return jsonify({"error": "Failed to delete asset"}), 500
    except Exception as e:
        logging.exception("Delete error")
        return jsonify({"error": "Failed to delete asset"}), 500


@app.route('/debug/asset_fields', methods=['GET'])
def debug_asset_fields():
    """
    Return a compact describe result for Asset object.
    Use this to find the actual API name of the user lookup in your org.
    """
    sf = get_salesforce_connection()
    if sf is None:
        return jsonify({'error': 'Salesforce connection failed'}), 500
    try:
        desc = sf.Asset.describe()
        fields = [{
            'name': f.get('name'),
            'label': f.get('label'),
            'type': f.get('type'),
            'referenceTo': f.get('referenceTo') or f.get('reference_to')
        } for f in desc.get('fields', [])]
        return jsonify({
            'success': True,
            'fields': fields,
            'PREFERRED_USER_LOOKUP': PREFERRED_USER_LOOKUP,
            'DEFAULT_ASSET_USER_ID_present': bool(DEFAULT_ASSET_USER_ID),
            'FORCE_DEFAULT_USER': FORCE_DEFAULT_USER,
            'WRITE_BOTH_LOOKUPS': WRITE_BOTH_LOOKUPS
        })
    except Exception as e:
        logging.exception("Error describing Asset")
        return jsonify({'error': str(e)}), 500


@app.route('/debug/test_user_mapping', methods=['GET'])
def debug_test_user_mapping():
    """
    Simulate mapping logic for a provided user_value query param and return attempts & resolved id.
    Example: /debug/test_user_mapping?user_value=alice@example.com
    """
    user_value = request.args.get('user_value')
    if not user_value:
        return jsonify({'error': 'Provide user_value as query param, e.g. ?user_value=Alice'}), 400
    sf = get_salesforce_connection()
    if sf is None:
        return jsonify({'error': 'Salesforce connection failed'}), 500
    try:
        # Reuse resolution function inside create_asset_record by performing similar queries
        def resolve_user_id_debug(value):
            attempts = []
            if isinstance(value, str) and value.startswith("005"):
                attempts.append({"method": "provided_id", "value": value})
                return value, attempts
            clean = re.sub(r"\s*\(.*\)$", "", value).strip()
            soql_clean = clean.replace("'", "\\'")
            # email
            if "@" in value and "." in value:
                soql = f"SELECT Id, Name, Email FROM User WHERE Email = '{soql_clean}' LIMIT 1"
                attempts.append({"method": "email", "soql": soql})
                try:
                    q = sf.query(soql)
                    if q and q.get("records"):
                        attempts.append({"result": "found_by_email", "record": q['records'][0]})
                        return q['records'][0]['Id'], attempts
                except Exception as e:
                    attempts.append({"error": str(e)})
            # exact name
            soql = f"SELECT Id, Name FROM User WHERE Name = '{soql_clean}' LIMIT 1"
            attempts.append({"method": "name_exact", "soql": soql})
            try:
                q = sf.query(soql)
                if q and q.get("records"):
                    attempts.append({"result": "found_by_name_exact", "record": q['records'][0]})
                    return q['records'][0]['Id'], attempts
            except Exception as e:
                attempts.append({"error": str(e)})
            # like
            soql = f"SELECT Id, Name FROM User WHERE Name LIKE '%{soql_clean}%' LIMIT 1"
            attempts.append({"method": "name_like", "soql": soql})
            try:
                q = sf.query(soql)
                if q and q.get("records"):
                    attempts.append({"result": "found_by_name_like", "record": q['records'][0]})
                    return q['records'][0]['Id'], attempts
            except Exception as e:
                attempts.append({"error": str(e)})
            # first/last fallback
            try:
                tokens = clean.split()
                if len(tokens) >= 2:
                    first = tokens[0].replace("'", "\\'")
                    last = tokens[-1].replace("'", "\\'")
                    soql = f"SELECT Id, Name FROM User WHERE FirstName = '{first}' AND LastName = '{last}' LIMIT 1"
                    attempts.append({"method": "first_last", "soql": soql})
                    try:
                        q = sf.query(soql)
                        if q and q.get("records"):
                            attempts.append({"result": "found_by_first_last", "record": q['records'][0]})
                            return q['records'][0]['Id'], attempts
                    except Exception as e:
                        attempts.append({"error": str(e)})
            except Exception as e:
                attempts.append({"error": str(e)})
            return None, attempts

        uid, details = resolve_user_id_debug(user_value)
        desc = sf.Asset.describe()
        fields = desc.get("fields", [])
        sample_field_names = [f.get('name') for f in fields][:80]
        return jsonify({
            'candidate_preference': PREFERRED_USER_LOOKUP,
            'resolved_user_id': uid,
            'details': details,
            'asset_fields_sample': sample_field_names,
            'DEFAULT_ASSET_USER_ID_present': bool(DEFAULT_ASSET_USER_ID)
        })
    except Exception as e:
        logging.exception("Error in debug mapping")
        return jsonify({'error': str(e)}), 500


@app.route("/generate-pdf", methods=["POST"])
def generate_pdf():
    try:
        if request.is_json:
            data = request.get_json()
            engineer_name = data.get("engineer_name")
            engineer_category = data.get("engineer_category")
            asset_ids = data.get("asset_ids", [])
            if not all([engineer_name, engineer_category, asset_ids]):
                return jsonify({"error": "Missing required fields"}), 400
            all_assets = load_assets_from_file()
            assets_data = []
            for aid in asset_ids:
                asset = next((a for a in all_assets if a.get("id") == aid), None)
                if asset:
                    assets_data.append({
                        'filename': asset.get('asset_name', 'Unknown Asset'),
                        'metadata': {
                            'Manufacturer': asset.get('manufacturer', 'N/A'),
                            'Model': asset.get('model_number', 'N/A'),
                            'Condition': asset.get('condition', 'N/A'),
                            'Category': asset.get('category', 'N/A'),
                            'Description': asset.get('visual_description', 'No description'),
                            'DetailedDescription': asset.get('detailed_description', 'No detailed description available.')
                        },
                        'image_base64': asset.get('image_base64', '')
                    })
            if not assets_data:
                return jsonify({"error": "No valid assets found"}), 404
            pdf_buffer = create_engineer_pdf_report(engineer_name, engineer_category, assets_data, None)
            filename = f"{engineer_name.replace(' ', '_')}_Asset_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
            return Response(pdf_buffer.getvalue(), mimetype="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})
        else:
            engineer_name = request.form.get("engineer_name")
            engineer_category = request.form.get("engineer_category")
            assets_json_str = request.form.get("assets_json")
            logo_file = request.files.get("logo")
            if not all([engineer_name, engineer_category, assets_json_str]):
                return jsonify({"error": "Missing required fields"}), 400
            try:
                assets_data = json.loads(assets_json_str)
            except Exception:
                return jsonify({"error": "Invalid JSON"}), 400
            logo_bytes = logo_file.read() if logo_file else None
            pdf_buffer = create_engineer_pdf_report(engineer_name, engineer_category, assets_data, logo_bytes)
            filename = f"{engineer_name.replace(' ', '_')}_Asset_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
            return Response(pdf_buffer.getvalue(), mimetype="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})
    except Exception as e:
        logging.exception("PDF generation error")
        return jsonify({"error": "Failed to generate PDF", "details": str(e)}), 500


@app.route("/asset-history", methods=["GET"])
def get_asset_history():
    try:
        return jsonify(load_asset_history())
    except Exception as e:
        logging.error(e)
        return jsonify({"error": "Failed to load asset history"}), 500


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Asset Inventory Flask Server Running",
        "version": "9.0 - Improved user mapping (production-ready defaults available)",
        "notes": [
            "Use /debug/asset_fields to inspect your org's Asset fields and find the actual API name of the user lookup.",
            "If your org uses a custom lookup (e.g. Technician__c), set PREFERRED_USER_LOOKUP in your .env to that API name.",
            "To force a default owner, set DEFAULT_ASSET_USER_ID=005xxxxxxxxxxxxx in your .env and FORCE_DEFAULT_USER=true.",
            "To write both the lookup and OwnerId set WRITE_BOTH_LOOKUPS=true in your .env."
        ]
    })


if __name__ == '__main__':
    logging.info("🚀 Asset Inventory Server starting")
    logging.info(f"DEFAULT_ASSET_USER_ID present: {bool(DEFAULT_ASSET_USER_ID)}")
    logging.info(f"PREFERRED_USER_LOOKUP: {PREFERRED_USER_LOOKUP or '(none)'}")
    logging.info(f"FORCE_DEFAULT_USER: {FORCE_DEFAULT_USER}")
    logging.info(f"WRITE_BOTH_LOOKUPS: {WRITE_BOTH_LOOKUPS}")
    app.run(debug=True)
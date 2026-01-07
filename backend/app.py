#!/usr/bin/env python3
# Full Flask server with robust Salesforce user lookup & mapping logic
# Fixed for Production Deployment on Render

import os
import base64
import json
import logging
import re
from datetime import datetime
from io import BytesIO

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# Optional external libraries
HAS_GROQ = False
HAS_REPORTLAB = False
Groq = None
RLImage = None
try:
    from groq import Groq
    HAS_GROQ = True
except Exception:
    logging.warning("⚠️ Groq library not available")

try:
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    HAS_REPORTLAB = True
except Exception:
    logging.warning("⚠️ reportlab not available")

from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceAuthenticationFailed, SalesforceGeneralError

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
ASSETS_FILE = os.getenv("ASSETS_FILE", "assets_storage.json")
ASSET_HISTORY_FILE = os.getenv("ASSET_HISTORY_FILE", "asset_history.json")
COMPANY_STORAGE_LOCATION = os.getenv("COMPANY_STORAGE_LOCATION", "Warehouse Warehouse")
DEFAULT_ASSET_ACCOUNT_ID = os.getenv("DEFAULT_ASSET_ACCOUNT_ID", "").strip()
DEFAULT_ASSET_USER_ID = os.getenv("DEFAULT_ASSET_USER_ID", "").strip()
DEFAULT_ASSET_USER_NAME = os.getenv("DEFAULT_ASSET_USER_NAME", "Warehouse Warehouse")
PREFERRED_USER_LOOKUP = os.getenv("PREFERRED_USER_LOOKUP", "").strip()
FORCE_DEFAULT_USER = os.getenv("FORCE_DEFAULT_USER", "false").lower() in ("1", "true", "yes")
WRITE_BOTH_LOOKUPS = os.getenv("WRITE_BOTH_LOOKUPS", "false").lower() in ("1", "true", "yes")

# =====================================================
# FLASK APP WITH PRODUCTION CORS
# =====================================================
app = Flask(__name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://assetpandafinalpoc-brvp.vercel.app")
CORS(app, resources={
    r"/*": {
        "origins": [
            FRONTEND_URL,
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:5000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024


def get_salesforce_connection():
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


def get_asset_metadata(base64_image, mime_type, api_key):
    if not HAS_GROQ:
        return {
            "AssetName": "Unknown Asset",
            "Manufacturer": "Unknown",
            "ModelNumber": "Unknown",
            "Condition": "unknown",
            "Category": "Unknown",
            "VisualDescription": "Image analysis unavailable",
            "DetailedDescription": "Image analysis not available."
        }

    client = Groq(api_key=api_key)
    prompt = """
You are an expert industrial asset analyzer for inventory management.
Analyze this image carefully and extract detailed asset information.

Return ONLY valid JSON with these exact fields:
{
  "AssetName": "descriptive name of the asset",
  "Manufacturer": "brand or manufacturer name (if visible)",
  "ModelNumber": "model number or identifier (if visible)",
  "Condition": "excellent/good/fair/poor based on visual inspection",
  "Category": "type of asset (e.g., Ladder, Pump, Valve, Motor, Tools, Safety Equipment, etc.)",
  "VisualDescription": "detailed physical description including color, size, material, distinctive features",
  "DetailedDescription": "comprehensive description covering purpose, specifications, condition, and usage"
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
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}}
                ]
            }
        ],
        temperature=0.3,
        max_tokens=2000
    )

    try:
        content = response.choices[0].message.content
        if isinstance(content, dict):
            return content
        return json.loads(content)
    except Exception as e:
        logging.error(f"Groq JSON parsing error: {e}")
        return {
            "AssetName": "Unknown Asset",
            "Manufacturer": "Unknown",
            "ModelNumber": "Unknown",
            "Condition": "unknown",
            "Category": "Unknown",
            "VisualDescription": "Failed to analyze",
            "DetailedDescription": "Unable to generate description."
        }


def create_asset_record(asset_name, asset_type_id, account_id=None, contact_id=None,
                        asset_description=None, serial_number=None, purchase_date=None,
                        price=None, user_value=None):
    sf = get_salesforce_connection()
    if sf is None:
        return {"success": False, "error": "Salesforce connection missing", "skipped": False}

    if not account_id and not contact_id:
        if DEFAULT_ASSET_ACCOUNT_ID:
            logging.info(f"Using DEFAULT_ASSET_ACCOUNT_ID: {DEFAULT_ASSET_ACCOUNT_ID}")
            account_id = DEFAULT_ASSET_ACCOUNT_ID
        else:
            msg = "Salesforce requires AccountId or ContactId. Set DEFAULT_ASSET_ACCOUNT_ID in .env"
            logging.warning("⚠️ " + msg)
            return {"success": False, "error": msg, "skipped": True}

    try:
        asset_data = {"Name": asset_name}
        if asset_description:
            asset_data["Description"] = asset_description[:32000]
        if asset_type_id and isinstance(asset_type_id, str) and len(asset_type_id) >= 15:
            asset_data["Asset_Type__c"] = asset_type_id
        if serial_number:
            asset_data["SerialNumber"] = serial_number
        if purchase_date:
            asset_data["PurchaseDate"] = purchase_date
        if price:
            try:
                asset_data["Price__c"] = float(price)
            except:
                asset_data["Price__c"] = price
        if account_id and account_id.startswith("001"):
            asset_data["AccountId"] = account_id
        if contact_id and contact_id.startswith("003"):
            asset_data["ContactId"] = contact_id
        if user_value and isinstance(user_value, str) and user_value.startswith("005"):
            asset_data["OwnerId"] = user_value

        try:
            desc = sf.Asset.describe()
            fields = desc.get("fields", [])
            valid_fields = {f["name"] for f in fields}
            field_map = {f["name"]: f for f in fields}

            def find_user_lookup_field():
                if PREFERRED_USER_LOOKUP and PREFERRED_USER_LOOKUP in field_map:
                    if field_map[PREFERRED_USER_LOOKUP].get("type") == "reference":
                        return PREFERRED_USER_LOOKUP
                for candidate in ("User__c", "Assigned_User__c", "Technician__c", "Engineer__c"):
                    if candidate in field_map and field_map[candidate].get("type") == "reference":
                        return candidate
                if "OwnerId" in field_map:
                    return "OwnerId"
                return None

            def resolve_user_id(value):
                attempts = []
                if not value:
                    return None, attempts
                if isinstance(value, str) and value.startswith("005"):
                    attempts.append({"method": "provided_id", "id": value})
                    return value, attempts

                clean = re.sub(r"\s*\(.*\)$", "", value).strip()
                soql_clean = clean.replace("'", "\\'")

                if "@" in value and "." in value:
                    soql = f"SELECT Id, Name, Email FROM User WHERE Email = '{soql_clean}' LIMIT 1"
                    attempts.append({"method": "email", "soql": soql})
                    try:
                        q = sf.query(soql)
                        if q and q.get("records"):
                            attempts.append({"result": "found_by_email"})
                            return q["records"][0]["Id"], attempts
                    except Exception as e:
                        attempts.append({"error": str(e)})

                soql = f"SELECT Id, Name FROM User WHERE Name = '{soql_clean}' LIMIT 1"
                attempts.append({"method": "name_exact", "soql": soql})
                try:
                    q = sf.query(soql)
                    if q and q.get("records"):
                        return q["records"][0]["Id"], attempts
                except Exception as e:
                    attempts.append({"error": str(e)})

                soql = f"SELECT Id, Name FROM User WHERE Name LIKE '%{soql_clean}%' LIMIT 1"
                attempts.append({"method": "name_like", "soql": soql})
                try:
                    q = sf.query(soql)
                    if q and q.get("records"):
                        return q["records"][0]["Id"], attempts
                except Exception as e:
                    attempts.append({"error": str(e)})

                return None, attempts

            candidate_field = find_user_lookup_field()
            mapped_user_id = None
            map_attempts = []

            if FORCE_DEFAULT_USER and DEFAULT_ASSET_USER_ID:
                mapped_user_id = DEFAULT_ASSET_USER_ID
                map_attempts.append({"method": "force_default"})
            elif user_value and isinstance(user_value, str) and user_value.startswith("005"):
                mapped_user_id = user_value
                map_attempts.append({"method": "provided_id"})
            elif user_value:
                uid, attempts = resolve_user_id(user_value)
                map_attempts.extend(attempts)
                if uid:
                    mapped_user_id = uid
            
            if not mapped_user_id and DEFAULT_ASSET_USER_ID:
                mapped_user_id = DEFAULT_ASSET_USER_ID
                map_attempts.append({"method": "fallback_default"})

            if mapped_user_id:
                if candidate_field and candidate_field in valid_fields:
                    asset_data[candidate_field] = mapped_user_id
                    if WRITE_BOTH_LOOKUPS and "OwnerId" in valid_fields:
                        asset_data["OwnerId"] = mapped_user_id
                elif "OwnerId" in valid_fields:
                    asset_data["OwnerId"] = mapped_user_id

            invalid_keys = [k for k in list(asset_data.keys()) if k not in valid_fields]
            for k in invalid_keys:
                asset_data.pop(k, None)
        except Exception as e:
            logging.warning(f"Could not describe Asset: {e}")

        result = sf.Asset.create(asset_data)
        logging.info(f"✅ Salesforce Asset created: {result}")
        return {"success": True, "result": result, "skipped": False}
    except Exception as e:
        logging.error(f"❌ Error creating Asset: {e}")
        return {"success": False, "error": str(e), "skipped": False}


def create_engineer_pdf_report(engineer_name, engineer_category, assets_data, logo_bytes):
    if not HAS_REPORTLAB:
        return None

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('ReportTitle', parent=styles['Heading1'], fontSize=24,
                                  textColor=colors.HexColor('#27549D'), alignment=TA_CENTER,
                                  fontName='Helvetica-Bold', spaceAfter=12)
    heading_style = ParagraphStyle('AssetHeading', parent=styles['Heading2'], fontSize=16,
                                    textColor=colors.HexColor('#27549D'), fontName='Helvetica-Bold', spaceAfter=8)
    desc_style = ParagraphStyle('Description', parent=styles['Normal'], fontSize=10,
                                 alignment=TA_LEFT, leading=14, spaceAfter=8)

    if logo_bytes:
        try:
            logo_img = RLImage(BytesIO(logo_bytes), width=1.2*inch, height=1.2*inch)
            logo_img.hAlign = 'CENTER'
            story.append(logo_img)
            story.append(Spacer(1, 0.2*inch))
        except:
            pass

    story.append(Paragraph("ASSET INVENTORY REPORT", title_style))
    story.append(Spacer(1, 0.2*inch))

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
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(info_table)
    story.append(PageBreak())

    for idx, asset in enumerate(assets_data, 1):
        asset_name = asset.get('filename', f"Asset {idx}")
        story.append(Paragraph(f"Asset #{idx}: {asset_name}", heading_style))
        story.append(Spacer(1, 0.15*inch))

        try:
            img_bytes = base64.b64decode(asset["image_base64"])
            img = RLImage(BytesIO(img_bytes), width=4*inch, height=3*inch)
            img.hAlign = 'CENTER'
            story.append(img)
            story.append(Spacer(1, 0.2*inch))
        except:
            story.append(Paragraph("Image unavailable", styles["Normal"]))

        metadata = asset.get("metadata", {})
        meta_rows = []
        for label, key in [("Manufacturer", "Manufacturer"), ("Model", "Model"),
                           ("Condition", "Condition"), ("Category", "Category")]:
            value = metadata.get(key, "N/A")
            if value and value != "N/A":
                meta_rows.append([label, str(value)])

        if meta_rows:
            meta_table = Table(meta_rows, colWidths=[120, 380])
            meta_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#E8F0FE")),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(meta_table)
            story.append(Spacer(1, 0.15*inch))

        detailed = metadata.get("DetailedDescription", "")
        if detailed:
            story.append(Paragraph("<b>Detailed Description:</b>", styles["Normal"]))
            story.append(Paragraph(detailed, desc_style))

        if idx != len(assets_data):
            story.append(PageBreak())

    doc.build(story)
    buffer.seek(0)
    return buffer


# =====================================================
# FLASK ROUTES
# =====================================================

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
    asset_type = request.form.get("asset_type", "")
    asset_id = request.form.get("asset_id", "")
    asset_name = request.form.get("asset_name", "")
    asset_number = request.form.get("asset_number", "")
    serial_number = request.form.get("serial_number", "")
    purchase_date = request.form.get("purchase_date", "")

    base64_str, img_bytes = encode_image_to_base64(image)

    try:
        raw_metadata = get_asset_metadata(base64_str, image.content_type, GROQ_API_KEY)

        assets = load_assets_from_file()
        existing_ids = [a.get("id", 0) for a in assets]
        new_id = max(existing_ids) + 1 if existing_ids else 1

        final_asset_name = asset_name if asset_name else raw_metadata.get("AssetName", "Unnamed Asset")

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
            "manufacturer": raw_metadata.get("Manufacturer", "Unknown"),
            "model_number": raw_metadata.get("ModelNumber", "Unknown"),
            "condition": raw_metadata.get("Condition", "unknown"),
            "visual_description": raw_metadata.get("VisualDescription", "No description"),
            "detailed_description": raw_metadata.get("DetailedDescription", "No detailed description."),
            "category": raw_metadata.get("Category", category),
            "image_base64": base64_str,
            "raw_metadata": raw_metadata,
            "stored_location": COMPANY_STORAGE_LOCATION,
            "uploaded_at": datetime.now().isoformat()
        }

        valid_account_id = account_id if account_id and account_id.startswith("001") else None
        valid_contact_id = contact_id if contact_id and contact_id.startswith("003") else None
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
            new_asset["salesforce_id"] = sf_result["result"].get("id")
            new_asset["salesforce_status"] = "created"
        elif sf_result.get("skipped"):
            new_asset["salesforce_status"] = "skipped"
            new_asset["salesforce_error"] = sf_result.get("error")
        else:
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
            return jsonify({
                "success": True,
                "message": "Asset saved successfully",
                "asset": new_asset,
                "salesforce_status": new_asset.get("salesforce_status"),
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
    sf = get_salesforce_connection()
    if sf is None:
        return jsonify({'error': 'Salesforce connection failed'}), 500
    try:
        desc = sf.Asset.describe()
        fields = [{
            'name': f.get('name'),
            'label': f.get('label'),
            'type': f.get('type'),
            'referenceTo': f.get('referenceTo')
        } for f in desc.get('fields', [])]
        return jsonify({
            'success': True,
            'fields': fields,
            'PREFERRED_USER_LOOKUP': PREFERRED_USER_LOOKUP
        })
    except Exception as e:
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
                        'filename': asset.get('asset_name', 'Unknown'),
                        'metadata': {
                            'Manufacturer': asset.get('manufacturer', 'N/A'),
                            'Model': asset.get('model_number', 'N/A'),
                            'Condition': asset.get('condition', 'N/A'),
                            'Category': asset.get('category', 'N/A'),
                            'Description': asset.get('visual_description', 'No description'),
                            'DetailedDescription': asset.get('detailed_description', '')
                        },
                        'image_base64': asset.get('image_base64', '')
                    })
            
            if not assets_data:
                return jsonify({"error": "No valid assets found"}), 404
            
            pdf_buffer = create_engineer_pdf_report(engineer_name, engineer_category, assets_data, None)
            filename = f"{engineer_name.replace(' ', '_')}_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
            return Response(pdf_buffer.getvalue(), mimetype="application/pdf",
                          headers={"Content-Disposition": f"attachment; filename={filename}"})
        else:
            engineer_name = request.form.get("engineer_name")
            engineer_category = request.form.get("engineer_category")
            assets_json_str = request.form.get("assets_json")
            logo_file = request.files.get("logo")
            
            if not all([engineer_name, engineer_category, assets_json_str]):
                return jsonify({"error": "Missing required fields"}), 400
            
            assets_data = json.loads(assets_json_str)
            logo_bytes = logo_file.read() if logo_file else None
            pdf_buffer = create_engineer_pdf_report(engineer_name, engineer_category, assets_data, logo_bytes)
            filename = f"{engineer_name.replace(' ', '_')}_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
            return Response(pdf_buffer.getvalue(), mimetype="application/pdf",
                          headers={"Content-Disposition": f"attachment; filename={filename}"})
    except Exception as e:
        logging.exception("PDF error")
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
        "version": "10.0 - Production Ready with CORS Fixed",
        "status": "healthy"
    })


if __name__ == "__main__":
    pass

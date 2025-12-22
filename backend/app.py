import os
import base64
import json
import logging
from datetime import datetime
from io import BytesIO

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

from groq import Groq
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.units import inch
from reportlab.lib import colors

from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Load API Key
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
if not GROQ_API_KEY:
    raise RuntimeError("Missing GROQ_API_KEY in .env")

# =====================================================
# LOCAL STORAGE PATH
# =====================================================
ASSETS_FILE = "assets_storage.json"

def load_assets_from_file():
    """Load assets from local JSON file"""
    if not os.path.exists(ASSETS_FILE):
        return []
    try:
        with open(ASSETS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Error loading assets: {e}")
        return []

def save_assets_to_file(assets):
    """Save assets to local JSON file"""
    try:
        with open(ASSETS_FILE, 'w') as f:
            json.dump(assets, f, indent=2)
        return True
    except Exception as e:
        logging.error(f"Error saving assets: {e}")
        return False

# =====================================================
# BASE64 ENCODING
# =====================================================
def encode_image_to_base64(uploaded_file):
    uploaded_file.seek(0)
    data = uploaded_file.read()
    return base64.b64encode(data).decode("utf-8"), data


# =====================================================
# GROQ API CALL - DETAILED METADATA
# =====================================================
def get_asset_metadata(base64_image, mime_type, api_key):
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
  "Category": "type of asset (e.g., Ladder, Pump, Valve, Motor, Tools, Safety Equipment, etc.)",
  "VisualDescription": "detailed physical description including color, size, material, distinctive features, visible wear, any labels or markings, approximate dimensions, and any other relevant details you can observe"
}

Be thorough in the VisualDescription - include:
- Physical appearance (color, material, construction)
- Dimensions or size estimates
- Brand markings or labels visible (look very carefully)
- Condition details (rust, wear, damage, cleanliness)
- Special features or characteristics
- Any text or numbers visible on the asset
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
        temperature=0.2
    )

    try:
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logging.error(f"Groq JSON parsing error: {e}")
        logging.error(f"Response was: {response.choices[0].message.content}")
        return {
            "AssetName": "Unknown Asset",
            "Manufacturer": "Unknown",
            "ModelNumber": "Unknown",
            "Condition": "unknown",
            "Category": "Unknown",
            "VisualDescription": "Failed to analyze asset"
        }


# =====================================================
# PDF GENERATION - FIXED FORMATTING
# =====================================================
def create_engineer_pdf_report(engineer_name, engineer_category, assets_data, logo_bytes):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)

    story = []
    styles = getSampleStyleSheet()

    # Custom styles
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
        leading=14
    )

    # Logo
    if logo_bytes:
        try:
            logo_img = RLImage(BytesIO(logo_bytes), width=1.2 * inch, height=1.2 * inch)
            logo_img.hAlign = 'CENTER'
            story.append(logo_img)
            story.append(Spacer(1, 0.2 * inch))
        except Exception as e:
            logging.warning(f"Logo error: {e}")

    # Title
    story.append(Paragraph("ASSET INVENTORY REPORT", title_style))
    story.append(Spacer(1, 0.2 * inch))

    # Engineer info table
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

    # Loop through assets
    for idx, asset in enumerate(assets_data, 1):
        asset_name = asset.get('filename', f"Asset {idx}")
        
        # Asset title
        story.append(Paragraph(f"Asset #{idx}: {asset_name}", heading_style))
        story.append(Spacer(1, 0.15 * inch))

        # Asset image
        try:
            img_bytes = base64.b64decode(asset["image_base64"])
            img = RLImage(BytesIO(img_bytes), width=4 * inch, height=3 * inch)
            img.hAlign = 'CENTER'
            story.append(img)
            story.append(Spacer(1, 0.2 * inch))
        except:
            story.append(Paragraph("Image unavailable", styles["Normal"]))
            story.append(Spacer(1, 0.1 * inch))

        # Metadata table
        metadata = asset.get("metadata", {})
        
        meta_rows = []
        
        # Add key fields in order
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

        # Description
        description = metadata.get("Description", "No description available")
        if description and description != "No description available":
            story.append(Paragraph("<b>Description:</b>", styles["Normal"]))
            story.append(Spacer(1, 0.05 * inch))
            story.append(Paragraph(description, desc_style))

        # Add page break except for last asset
        if idx != len(assets_data):
            story.append(PageBreak())

    doc.build(story)
    buffer.seek(0)
    return buffer


# =====================================================
# FLASK SERVER
# =====================================================
app = Flask(__name__)
CORS(app)

# CRITICAL FIX: Increase max content length to 50MB
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/upload-image", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image = request.files["image"]
    engineer_name = request.form.get("engineer_name", "Unknown")
    category = request.form.get("category", "general")
    
    base64_str, img_bytes = encode_image_to_base64(image)

    try:
        raw_metadata = get_asset_metadata(base64_str, image.content_type, GROQ_API_KEY)
        
        assets = load_assets_from_file()
        
        # FIX: Generate unique IDs properly
        existing_ids = [a.get("id", 0) for a in assets]
        new_id = max(existing_ids) + 1 if existing_ids else 1
        
        new_asset = {
            "id": new_id,
            "filename": image.filename,
            "engineer_name": engineer_name,
            "engineer_category": category,
            "asset_name": raw_metadata.get("AssetName") or "Unnamed Asset",
            "manufacturer": raw_metadata.get("Manufacturer") or "Unknown",
            "model_number": raw_metadata.get("ModelNumber") or "Unknown",
            "condition": raw_metadata.get("Condition") or "unknown",
            "visual_description": raw_metadata.get("VisualDescription") or "No description",
            "category": raw_metadata.get("Category") or category,
            "image_base64": base64_str,
            "raw_metadata": raw_metadata,
            "uploaded_at": datetime.now().isoformat()
        }
        
        assets.append(new_asset)
        
        if save_assets_to_file(assets):
            logging.info(f"✅ Asset saved: {image.filename} with ID {new_id}")
            return jsonify({
                "success": True,
                "message": "Asset saved successfully",
                "asset": new_asset
            })
        else:
            return jsonify({"error": "Failed to save asset"}), 500
            
    except Exception as e:
        logging.error(f"Upload error: {e}")
        return jsonify({"error": "Processing failed", "details": str(e)}), 500


@app.route("/assets", methods=["GET"])
def get_assets():
    try:
        assets = load_assets_from_file()
        return jsonify(assets)
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
        else:
            return jsonify({"error": "Asset not found"}), 404
    except Exception as e:
        logging.error(f"Error loading asset: {e}")
        return jsonify({"error": "Failed to load asset"}), 500


@app.route("/assets/<int:asset_id>", methods=["DELETE"])
def delete_asset(asset_id):
    try:
        assets = load_assets_from_file()
        original_count = len(assets)
        assets = [a for a in assets if a.get("id") != asset_id]
        
        if len(assets) == original_count:
            return jsonify({"error": "Asset not found"}), 404
        
        if save_assets_to_file(assets):
            logging.info(f"✅ Asset {asset_id} deleted")
            return jsonify({"success": True, "message": "Asset deleted"})
        else:
            return jsonify({"error": "Failed to delete asset"}), 500
    except Exception as e:
        logging.error(f"Delete error: {e}")
        return jsonify({"error": "Failed to delete asset"}), 500


# =====================================================
# FIX 1: Accept JSON payload with asset IDs (RECOMMENDED)
# =====================================================
@app.route("/generate-pdf", methods=["POST"])
def generate_pdf():
    try:
        # Check if it's JSON request (new method)
        if request.is_json:
            data = request.get_json()
            engineer_name = data.get("engineer_name")
            engineer_category = data.get("engineer_category")
            asset_ids = data.get("asset_ids", [])
            
            if not all([engineer_name, engineer_category, asset_ids]):
                return jsonify({"error": "Missing required fields"}), 400
            
            # Load all assets from storage
            all_assets = load_assets_from_file()
            
            # Filter assets by IDs
            assets_data = []
            for asset_id in asset_ids:
                asset = next((a for a in all_assets if a.get("id") == asset_id), None)
                if asset:
                    assets_data.append({
                        'filename': asset.get('asset_name', 'Unknown Asset'),
                        'metadata': {
                            'Manufacturer': asset.get('manufacturer', 'N/A'),
                            'Model': asset.get('model_number', 'N/A'),
                            'Condition': asset.get('condition', 'N/A'),
                            'Category': asset.get('category', 'N/A'),
                            'Description': asset.get('visual_description', 'No description'),
                        },
                        'image_base64': asset.get('image_base64', '')
                    })
            
            if not assets_data:
                return jsonify({"error": "No valid assets found"}), 404
            
            logging.info(f"📄 Generating PDF with {len(assets_data)} assets for {engineer_name}")
            
            # Generate PDF
            pdf_buffer = create_engineer_pdf_report(
                engineer_name, engineer_category, assets_data, None
            )
            
            filename = f"{engineer_name.replace(' ', '_')}_Asset_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
            
            return Response(
                pdf_buffer.getvalue(),
                mimetype="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
        
        # OLD METHOD: FormData with base64 images (fallback)
        else:
            engineer_name = request.form.get("engineer_name")
            engineer_category = request.form.get("engineer_category")
            assets_json_str = request.form.get("assets_json")
            logo_file = request.files.get("logo")

            if not all([engineer_name, engineer_category, assets_json_str]):
                return jsonify({"error": "Missing required fields"}), 400

            try:
                assets_data = json.loads(assets_json_str)
            except:
                return jsonify({"error": "Invalid JSON"}), 400

            logo_bytes = logo_file.read() if logo_file else None
            
            logging.info(f"📄 Generating PDF (old method) with {len(assets_data)} assets")

            pdf_buffer = create_engineer_pdf_report(
                engineer_name, engineer_category, assets_data, logo_bytes
            )

            filename = f"{engineer_name.replace(' ', '_')}_Asset_Report_{datetime.now().strftime('%Y%m%d')}.pdf"

            return Response(
                pdf_buffer.getvalue(),
                mimetype="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
            
    except Exception as e:
        logging.error(f"❌ PDF generation error: {e}")
        return jsonify({"error": "Failed to generate PDF", "details": str(e)}), 500


# =====================================================
# FIX 2: Alternative lightweight endpoint (optional)
# =====================================================
@app.route("/generate-pdf-lite", methods=["POST"])
def generate_pdf_lite():
    """Lightweight PDF generation - accepts asset IDs only"""
    try:
        engineer_name = request.form.get("engineer_name")
        engineer_category = request.form.get("engineer_category")
        assets_json_str = request.form.get("assets_json")
        
        if not all([engineer_name, engineer_category, assets_json_str]):
            return jsonify({"error": "Missing required fields"}), 400
        
        try:
            asset_metadata_list = json.loads(assets_json_str)
        except:
            return jsonify({"error": "Invalid JSON"}), 400
        
        # Load full assets from storage using IDs
        all_assets = load_assets_from_file()
        assets_data = []
        
        for meta in asset_metadata_list:
            asset_id = meta.get('id')
            if asset_id:
                asset = next((a for a in all_assets if a.get("id") == asset_id), None)
                if asset:
                    assets_data.append({
                        'filename': asset.get('asset_name', meta.get('filename', 'Unknown')),
                        'metadata': meta.get('metadata', {}),
                        'image_base64': asset.get('image_base64', '')
                    })
        
        if not assets_data:
            return jsonify({"error": "No assets found"}), 404
        
        logging.info(f"📄 Generating lite PDF with {len(assets_data)} assets")
        
        pdf_buffer = create_engineer_pdf_report(
            engineer_name, engineer_category, assets_data, None
        )
        
        filename = f"{engineer_name.replace(' ', '_')}_Asset_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        return Response(
            pdf_buffer.getvalue(),
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        logging.error(f"❌ Lite PDF generation error: {e}")
        return jsonify({"error": "Failed to generate PDF", "details": str(e)}), 500


@app.route("/")
def home():
    return jsonify({
        "message": "Asset Inventory Flask Server Running",
        "version": "2.0",
        "endpoints": {
            "/upload-image": "POST - Upload and analyze asset image",
            "/assets": "GET - Get all assets",
            "/assets/<id>": "GET/DELETE - Get or delete specific asset",
            "/generate-pdf": "POST - Generate PDF report (accepts JSON or FormData)",
            "/generate-pdf-lite": "POST - Generate lightweight PDF",
            "/health": "GET - Health check"
        }
    })


if __name__ == '__main__':
    print("🚀 Asset Inventory Server")
    print("=" * 50)
    print("📍 Running at: http://127.0.0.1:5000/")
    print("📝 Max upload size: 50MB")
    print("🔧 Duplicate ID prevention: ENABLED")
    print("=" * 50)
    app.run(debug=True)
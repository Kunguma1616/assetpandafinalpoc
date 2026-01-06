# Save as: quick_asset_type.py
import os
from simple_salesforce import Salesforce
from dotenv import load_dotenv

load_dotenv()

sf = Salesforce(
    username=os.getenv("SF_USERNAME"),
    password=os.getenv("SF_PASSWORD"),
    security_token=os.getenv("SF_SECURITY_TOKEN"),
    domain=os.getenv("SF_DOMAIN", "login")
)

result = sf.query("SELECT Id, Name FROM Asset_Type__c LIMIT 1")
if result['records']:
    print(f"\n✅ Use this Asset Type ID:")
    print(f"   ID: {result['records'][0]['Id']}")
    print(f"   Name: {result['records'][0]['Name']}")
    print(f"\n📝 Update line in your frontend:")
    print(f"   formData.append('asset_type', '{result['records'][0]['Id']}');")
else:
    print("❌ No Asset Types found. You need to create one in Salesforce first!")
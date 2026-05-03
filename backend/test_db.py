import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

# Get the connection string
database_url = os.environ.get('DATABASE_URL')

print("🔌 Attempting to connect...")
print("Connection URL:", database_url.replace("chuksinChrist%402319", "****"))  # Hides password

try:
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    print("✅ CONNECTED SUCCESSFULLY!\n")
    
    # Show all tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    
    tables = cur.fetchall()
    print("📊 Your Database Tables:")
    print("-" * 40)
    
    for table in tables:
        cur.execute(f'SELECT COUNT(*) FROM "{table[0]}"')
        count = cur.fetchone()[0]
        print(f"  ✅ {table[0]}: {count} records")
    
    # Show test data
    print("\n👥 Users in database:")
    print("-" * 40)
    cur.execute("SELECT email, user_type, is_verified FROM users")
    for user in cur.fetchall():
        print(f"  • {user[0]} ({user[1]}) - Verified: {user[2]}")
    
    print("\n💼 Active Jobs:")
    print("-" * 40)
    cur.execute("SELECT job_title, organization_name, status FROM job_listings")
    for job in cur.fetchall():
        print(f"  • {job[0]} at {job[1]} ({job[2]})")
    
    cur.close()
    conn.close()
    
    print("\n" + "=" * 40)
    print("🎉 DATABASE IS READY FOR DEVELOPMENT!")
    print("=" * 40)
    
except Exception as e:
    print(f"\n❌ Connection failed!")
    print(f"Error: {e}")
    print("\n💡 Troubleshooting:")
    print("1. Make sure .env file exists in backend folder")
    print("2. Check if password is correct")
    print("3. Verify the project ID is: byffbedmxguxbdfhfhvg")
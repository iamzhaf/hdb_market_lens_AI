import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# 1. Database Connection Configuration
conn_params = {
    "host": os.getenv("POSTGRES_HOST"),
    "database": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
    "port": os.getenv("POSTGRES_PORT"),
}

# 2. Path to the folder containing your HDB resale CSV files
csv_folder = r"C:\Users\Zhafran\OneDrive\06 AI and ML Projects\AI_Agents\resale_flat_prices\1990_2025"

def ingest_csv_files(csv_files: list[str]):
    conn = None
    cursor = None
    try:
        # Connect to the Postgres database
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # FIX: Force Postgres to look inside the 'hdb' schema automatically
        cursor.execute("SET search_path TO hdb, public;")

        # Loop through all files in the directory
        for file_path in csv_files:
            filename = os.path.basename(file_path)
            print(f"Ingesting: {filename}...")
                
            # 1. Create a temporary staging table that mirrors your main table structure
            cursor.execute("""
                CREATE TEMP TABLE staging_hdb (LIKE hdb_resale_prices);
                ALTER TABLE staging_hdb DROP COLUMN source_filename; -- Match CSV columns exactly
            """)
            
            # 2. Stream the CSV file straight into the staging table using COPY
            with open(file_path, 'r', encoding='utf-8') as f:
                copy_sql = """
                    COPY staging_hdb(
                        month, town, flat_type, block, street_name, storey_range, 
                        floor_area_sqm, flat_model, lease_commence_date, resale_price
                    ) 
                    FROM STDIN 
                    WITH CSV HEADER DELIMITER ',';
                """
                cursor.copy_expert(sql=copy_sql, file=f)
            
            # 3. Insert into main table while appending the filename dynamically
            insert_sql = """
                INSERT INTO hdb.hdb_resale_prices (
                    month, town, flat_type, block, street_name, storey_range, 
                    floor_area_sqm, flat_model, lease_commence_date, resale_price,
                    source_filename
                )
                SELECT *, %s FROM staging_hdb;
            """
            cursor.execute(insert_sql, (filename,))
            
            # 4. Drop staging table to clean up before the next file in the loop
            cursor.execute("DROP TABLE staging_hdb;")
    
        # Commit the changes so they stick
        conn.commit()
        print("🎉 Success! All matching hdb_ files have been safely ingested with lineage metadata.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
        if conn:
            conn.rollback() # Rollback changes if something breaks mid-way
        
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

if __name__ == "__main__":

    import pandas as pd
    
    folder_path = r"C:\Users\Zhafran\OneDrive\Data Projects Datasets"

    # create a placeholder to store the csv files to be ingested into the database
    csv_files = []

    # loop through the folder_path and append all csv files to the csv_files list
    for file in os.listdir(folder_path):
        if file.startswith("hdb_resale_flat_prices_2017_onwards") and file.endswith(".csv"):
            csv_files.append(os.path.join(folder_path, file))

    ingest_csv_files(csv_files)
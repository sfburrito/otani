from app import app, db
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)

logger = logging.getLogger(__name__)

def init_db():
    try:
        logger.info("Starting database initialization...")
        
        with app.app_context():
            # Create all tables
            logger.info("Creating database tables...")
            db.create_all()
            
            # Verify tables exist
            logger.info("Verifying tables...")
            engine = db.get_engine()
            inspector = db.inspect(engine)
            tables = inspector.get_table_names()
            logger.info(f"Found tables: {tables}")
            
            if 'user_preferences' not in tables:
                raise Exception("user_preferences table was not created successfully")
                
            logger.info("Database initialization completed successfully!")
            
    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
        raise

if __name__ == "__main__":
    init_db()

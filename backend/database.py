from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ---------------------------------------------------------
# DATABASE CONNECTION STRING
# ---------------------------------------------------------

AZURE_CONNECTION_STRING = (
    "mssql+pyodbc://USERNAME:PASSWORD@SERVER_NAME.database.windows.net:1433/hira_db"
    "?driver=ODBC+Driver+18+for+SQL+Server"
    "&Encrypt=yes"
    "&TrustServerCertificate=no"
)

# Create SQLAlchemy engine
engine = create_engine(
    AZURE_CONNECTION_STRING,
    fast_executemany=True,
    pool_pre_ping=True,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ORM base class
Base = declarative_base()


# ---------------------------------------------------------
# Dependency utility 
# ---------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

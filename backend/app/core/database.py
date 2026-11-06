import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./erp_odoo.db")

# Forzar el dialecto psycopg2 compatible para PostgreSQL en la nube
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def apply_migrations():
    """Garantiza automáticamente que las columnas añadidas existan en SQLite y PostgreSQL sin fallar."""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        migrations = [
            ("sale_order_line", "uom_name", "VARCHAR(64)"),
            ("account_move_line", "uom_name", "VARCHAR(64)"),
            ("stock_move", "uom_name", "VARCHAR(64)"),
            ("sale_order_line", "tax_percent", "FLOAT DEFAULT 19.0"),
            ("account_move_line", "tax_percent", "FLOAT DEFAULT 19.0"),
        ]
        for tbl, col, col_type in migrations:
            if tbl in tables:
                cols = [c["name"] for c in inspector.get_columns(tbl)]
                if col not in cols:
                    print(f"[MIGRATION] Agregando columna {col} a {tbl}...")
                    with engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN {col} {col_type}"))
                    print(f"[MIGRATION] Columna {col} agregada exitosamente a {tbl}.")
    except Exception as e:
        print(f"[MIGRATION WARNING] {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# backend/scripts/init_data.py
"""Initialize database with default data"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from datetime import datetime
from decimal import Decimal
import logging

from app.core.database import SessionLocal, init_db
from app.modules.auth.models import User, Role, Permission
from app.modules.auth.service import AuthService
from app.modules.facilities.models import Facility, Product, Customer, Carrier
from app.modules.tanks.models import Tank
from app.modules.loading_bays.models import LoadingBay, LoadingBayType, LoadingBayStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_roles_and_permissions(db):
    """Create default roles and permissions"""
    logger.info("Creating roles and permissions...")
    
    # Define permissions
    permissions_data = [
        # Tanks
        {"resource": "tanks", "action": "read", "description": "View tank information"},
        {"resource": "tanks", "action": "write", "description": "Create/update tanks"},
        {"resource": "tanks", "action": "gauge", "description": "Perform tank gauging"},
        
        # Loading Bays
        {"resource": "loading_bays", "action": "read", "description": "View loading bays"},
        {"resource": "loading_bays", "action": "write", "description": "Manage loading bays"},
        {"resource": "loading_bays", "action": "operate", "description": "Operate loading bays"},
        
        # Transactions
        {"resource": "transactions", "action": "read", "description": "View transactions"},
        {"resource": "transactions", "action": "create", "description": "Create transactions"},
        {"resource": "transactions", "action": "complete", "description": "Complete transactions"},
        {"resource": "transactions", "action": "cancel", "description": "Cancel transactions"},
        
        # Reports
        {"resource": "reports", "action": "read", "description": "View reports"},
        {"resource": "reports", "action": "create", "description": "Generate reports"},
        {"resource": "reports", "action": "export", "description": "Export data"},
        
        # Users
        {"resource": "users", "action": "read", "description": "View users"},
        {"resource": "users", "action": "write", "description": "Manage users"},
    ]
    
    permissions = []
    for perm_data in permissions_data:
        perm = db.query(Permission).filter(
            Permission.resource == perm_data["resource"],
            Permission.action == perm_data["action"]
        ).first()
        
        if not perm:
            perm = Permission(**perm_data)
            db.add(perm)
            db.commit()
        
        permissions.append(perm)
    
    # Define roles with their permissions
    roles_data = {
        "operator": {
            "description": "Basic operator role",
            "permissions": [
                ("tanks", "read"),
                ("tanks", "gauge"),
                ("loading_bays", "read"),
                ("loading_bays", "operate"),
                ("transactions", "read"),
                ("transactions", "create"),
                ("reports", "read")
            ]
        },
        "supervisor": {
            "description": "Supervisor with extended permissions",
            "permissions": [
                ("tanks", "read"),
                ("tanks", "write"),
                ("tanks", "gauge"),
                ("loading_bays", "read"),
                ("loading_bays", "write"),
                ("loading_bays", "operate"),
                ("transactions", "read"),
                ("transactions", "create"),
                ("transactions", "complete"),
                ("transactions", "cancel"),
                ("reports", "read"),
                ("reports", "create"),
                ("reports", "export")
            ]
        },
        "manager": {
            "description": "Manager with full operational access",
            "permissions": [
                ("tanks", "read"),
                ("tanks", "write"),
                ("tanks", "gauge"),
                ("loading_bays", "read"),
                ("loading_bays", "write"),
                ("loading_bays", "operate"),
                ("transactions", "read"),
                ("transactions", "create"),
                ("transactions", "complete"),
                ("transactions", "cancel"),
                ("reports", "read"),
                ("reports", "create"),
                ("reports", "export"),
                ("users", "read")
            ]
        },
        "admin": {
            "description": "System administrator",
            "permissions": "all"  # Will get all permissions
        }
    }
    
    for role_name, role_info in roles_data.items():
        role = db.query(Role).filter(Role.name == role_name).first()
        
        if not role:
            role = Role(name=role_name, description=role_info["description"])
            db.add(role)
            db.commit()
        
        # Assign permissions
        if role_info["permissions"] == "all":
            role.permissions = permissions
        else:
            role_perms = []
            for resource, action in role_info["permissions"]:
                perm = db.query(Permission).filter(
                    Permission.resource == resource,
                    Permission.action == action
                ).first()
                if perm:
                    role_perms.append(perm)
            role.permissions = role_perms
        
        db.commit()
    
    logger.info("Roles and permissions created successfully")

def create_default_users(db):
    """Create default users"""
    logger.info("Creating default users...")
    
    auth_service = AuthService(db)
    
    users_data = [
        {
            "username": "admin",
            "email": "admin@industrialloading.com",
            "password": "Admin123!",
            "full_name": "System Administrator",
            "is_superuser": True,
            "role": "admin"
        },
        {
            "username": "manager",
            "email": "manager@industrialloading.com",
            "password": "Manager123!",
            "full_name": "Terminal Manager",
            "role": "manager"
        },
        {
            "username": "supervisor",
            "email": "supervisor@industrialloading.com",
            "password": "Supervisor123!",
            "full_name": "Operations Supervisor",
            "role": "supervisor"
        },
        {
            "username": "operator",
            "email": "operator@industrialloading.com",
            "password": "Operator123!",
            "full_name": "Loading Operator",
            "role": "operator"
        }
    ]
    
    for user_data in users_data:
        existing_user = auth_service.get_user_by_username(user_data["username"])
        
        if not existing_user:
            # Create user
            role_name = user_data.pop("role")
            is_superuser = user_data.pop("is_superuser", False)
            
            from app.modules.auth.schemas import UserCreate
            user_create = UserCreate(**user_data)
            user = auth_service.create_user(user_create)
            
            # Set superuser flag
            if is_superuser:
                user.is_superuser = True
                db.commit()
            
            # Assign role
            role = db.query(Role).filter(Role.name == role_name).first()
            if role and role not in user.roles:
                user.roles.append(role)
                db.commit()
            
            logger.info(f"Created user: {user.username}")

def create_facility_data(db):
    """Create default facility data"""
    logger.info("Creating facility data...")
    
    # Create facility
    facility = db.query(Facility).filter(Facility.facility_code == "MAIN-01").first()
    
    if not facility:
        facility = Facility(
            facility_code="MAIN-01",
            facility_name="Main Terminal",
            facility_type="terminal",
            address="123 Industrial Way",
            city="Houston",
            state="TX",
            postal_code="77001",
            country="USA",
            phone="713-555-0100",
            email="ops@mainterminal.com",
            contact_name="John Smith",
            epa_id="TXD123456789",
            operating_hours="24/7",
            time_zone="America/Chicago"
        )
        db.add(facility)
        db.commit()
        logger.info("Created facility: Main Terminal")
    
    # Create products
    products_data = [
        {
            "product_code": "REG87",
            "product_name": "Regular Gasoline (87 Octane)",
            "product_type": "gasoline",
            "specific_gravity": Decimal("0.7400"),
            "api_gravity": Decimal("60.0"),
            "vapor_pressure": Decimal("7.0"),
            "flash_point": Decimal("-45.0"),
            "hazard_class": "3",
            "un_number": "UN1203",
            "packing_group": "II"
        },
        {
            "product_code": "PREM93",
            "product_name": "Premium Gasoline (93 Octane)",
            "product_type": "gasoline",
            "specific_gravity": Decimal("0.7500"),
            "api_gravity": Decimal("57.0"),
            "vapor_pressure": Decimal("7.0"),
            "flash_point": Decimal("-45.0"),
            "hazard_class": "3",
            "un_number": "UN1203",
            "packing_group": "II"
        },
        {
            "product_code": "ULSD",
            "product_name": "Ultra Low Sulfur Diesel",
            "product_type": "diesel",
            "specific_gravity": Decimal("0.8500"),
            "api_gravity": Decimal("35.0"),
            "vapor_pressure": Decimal("0.5"),
            "flash_point": Decimal("125.0"),
            "hazard_class": "3",
            "un_number": "UN1202",
            "packing_group": "III"
        }
    ]
    
    for prod_data in products_data:
        product = db.query(Product).filter(
            Product.product_code == prod_data["product_code"]
        ).first()
        
        if not product:
            product = Product(**prod_data)
            db.add(product)
            db.commit()
            logger.info(f"Created product: {product.product_name}")
    
    # Create tanks
    tanks_data = [
        {
            "tank_number": "T-001",
            "capacity": Decimal("50000"),
            "working_capacity": Decimal("47500"),
            "product": "REG87",
            "current_level": Decimal("22.5"),
            "current_volume": Decimal("28750"),
            "current_temperature": Decimal("72.5")
        },
        {
            "tank_number": "T-002",
            "capacity": Decimal("50000"),
            "working_capacity": Decimal("47500"),
            "product": "PREM93",
            "current_level": Decimal("18.7"),
            "current_volume": Decimal("23875"),
            "current_temperature": Decimal("73.2")
        },
        {
            "tank_number": "T-003",
            "capacity": Decimal("75000"),
            "working_capacity": Decimal("71250"),
            "product": "ULSD",
            "current_level": Decimal("31.2"),
            "current_volume": Decimal("52500"),
            "current_temperature": Decimal("74.8")
        }
    ]
    
    for tank_data in tanks_data:
        tank = db.query(Tank).filter(
            Tank.tank_number == tank_data["tank_number"]
        ).first()
        
        if not tank:
            product_code = tank_data.pop("product")
            product = db.query(Product).filter(
                Product.product_code == product_code
            ).first()
            
            tank = Tank(
                facility_id=facility.id,
                product_id=product.id if product else None,
                **tank_data
            )
            db.add(tank)
            db.commit()
            logger.info(f"Created tank: {tank.tank_number}")
    
    # Create loading bays
    bays_data = [
        {
            "bay_number": "BAY-01",
            "bay_type": LoadingBayType.TRUCK,
            "max_flow_rate": Decimal("600"),
            "max_pressure": Decimal("50"),
            "pipeline_size": Decimal("4"),
            "vapor_recovery": True,
            "overfill_protection": True,
            "emergency_shutdown": True
        },
        {
            "bay_number": "BAY-02",
            "bay_type": LoadingBayType.TRUCK,
            "max_flow_rate": Decimal("600"),
            "max_pressure": Decimal("50"),
            "pipeline_size": Decimal("4"),
            "vapor_recovery": True,
            "overfill_protection": True,
            "emergency_shutdown": True
        },
        {
            "bay_number": "BAY-03",
            "bay_type": LoadingBayType.RAIL,
            "max_flow_rate": Decimal("1200"),
            "max_pressure": Decimal("75"),
            "pipeline_size": Decimal("6"),
            "vapor_recovery": False,
            "overfill_protection": True,
            "emergency_shutdown": True
        }
    ]
    
    for bay_data in bays_data:
        bay = db.query(LoadingBay).filter(
            LoadingBay.bay_number == bay_data["bay_number"]
        ).first()
        
        if not bay:
            bay = LoadingBay(
                facility_id=facility.id,
                status=LoadingBayStatus.AVAILABLE,
                **bay_data
            )
            db.add(bay)
            db.commit()
            logger.info(f"Created loading bay: {bay.bay_number}")
    
    # Create sample customers
    customers_data = [
        {
            "customer_code": "CUST001",
            "customer_name": "ABC Transport Inc.",
            "customer_type": "wholesale",
            "billing_address": "456 Commerce St",
            "billing_city": "Houston",
            "billing_state": "TX",
            "billing_postal_code": "77002",
            "primary_contact": "Jane Doe",
            "phone": "713-555-0200",
            "email": "billing@abctransport.com",
            "credit_limit": Decimal("100000"),
            "payment_terms": "Net 30"
        },
        {
            "customer_code": "CUST002",
            "customer_name": "XYZ Logistics LLC",
            "customer_type": "wholesale",
            "billing_address": "789 Shipping Ave",
            "billing_city": "Houston",
            "billing_state": "TX",
            "billing_postal_code": "77003",
            "primary_contact": "Bob Johnson",
            "phone": "713-555-0300",
            "email": "accounts@xyzlogistics.com",
            "credit_limit": Decimal("75000"),
            "payment_terms": "Net 15"
        }
    ]
    
    for cust_data in customers_data:
        customer = db.query(Customer).filter(
            Customer.customer_code == cust_data["customer_code"]
        ).first()
        
        if not customer:
            customer = Customer(**cust_data)
            db.add(customer)
            db.commit()
            logger.info(f"Created customer: {customer.customer_name}")
    
    # Create sample carriers
    carriers_data = [
        {
            "carrier_code": "CARR001",
            "carrier_name": "Safe Haul Trucking",
            "dot_number": "1234567",
            "mc_number": "987654",
            "insurance_provider": "Commercial Insurance Co.",
            "insurance_policy": "POL123456",
            "insurance_expiry": datetime(2025, 12, 31),
            "insurance_amount": Decimal("1000000"),
            "contact_name": "Mike Wilson",
            "phone": "713-555-0400",
            "email": "dispatch@safehaultrucking.com",
            "safety_rating": "Satisfactory"
        }
    ]
    
    for carr_data in carriers_data:
        carrier = db.query(Carrier).filter(
            Carrier.carrier_code == carr_data["carrier_code"]
        ).first()
        
        if not carrier:
            carrier = Carrier(**carr_data)
            db.add(carrier)
            db.commit()
            logger.info(f"Created carrier: {carrier.carrier_name}")

def main():
    """Initialize database with default data"""
    logger.info("Initializing database...")
    
    # Initialize database tables
    init_db()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Create default data
        create_roles_and_permissions(db)
        create_default_users(db)
        create_facility_data(db)
        
        logger.info("Database initialization completed successfully!")
        logger.info("\nDefault users created:")
        logger.info("  admin / Admin123!")
        logger.info("  manager / Manager123!")
        logger.info("  supervisor / Supervisor123!")
        logger.info("  operator / Operator123!")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
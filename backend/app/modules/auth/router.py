from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.auth import hash_password, verify_password, create_access_token, decode_token, oauth2_scheme
from backend.app.models.models import ResUser

router = APIRouter(prefix="/auth", tags=["Autenticación"])


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    city: Optional[str] = None
    avatar_color: Optional[str] = "bg-indigo-600"
    active: bool

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CreateUserRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"
    city: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> ResUser:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token no contiene identificador de usuario")
    user = db.query(ResUser).filter(ResUser.id == int(user_id), ResUser.active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
    return user


@router.post("/login", response_model=LoginResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(ResUser).filter(ResUser.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas (correo o contraseña errónea)"
        )
    if not user.active:
        raise HTTPException(status_code=403, detail="Usuario desactivado")

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return LoginResponse(
        access_token=token,
        user=UserOut.model_validate(user)
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: ResUser = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(profile_in: UpdateProfileRequest, current_user: ResUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if profile_in.name is not None:
        current_user.name = profile_in.name
    if profile_in.city is not None:
        current_user.city = profile_in.city
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(ResUser).filter(ResUser.active == True).all()


@router.post("/users", response_model=UserOut)
def create_user(user_in: CreateUserRequest, db: Session = Depends(get_db)):
    existing = db.query(ResUser).filter(ResUser.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con este correo electrónico")

    colors = ["bg-indigo-600", "bg-emerald-600", "bg-amber-600", "bg-purple-600", "bg-blue-600"]
    import random
    new_user = ResUser(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        city=user_in.city,
        avatar_color=random.choice(colors)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, COOKIE_NAME, SessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { 
      schoolName, 
      directorFirstName, 
      directorLastName, 
      fullName,
      email, 
      password, 
      phone, 
      city, 
      planCode,
      billingCycle,
      role 
    } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: "Veuillez renseigner au moins votre adresse e-mail et un mot de passe." },
        { status: 400 }
      );
    }

    // Gestion intelligente du nom et prénom
    if (fullName && !directorLastName) {
      const parts = fullName.trim().split(" ");
      directorLastName = parts[0] || "Directeur";
      directorFirstName = parts.slice(1).join(" ") || "Responsable";
    }

    const cleanLastName = (directorLastName || "Directeur").trim();
    const cleanFirstName = (directorFirstName || "Principal").trim();
    const cleanSchoolName = (schoolName || `Complexe Scolaire ${cleanLastName}`).trim();
    const cleanPhone = (phone || "+228 90 12 34 56").trim();
    const cleanCity = (city || "Lomé").trim();
    const assignedRole = role === "ESTABLISHMENT_ADMIN" ? "ESTABLISHMENT_ADMIN" : "DIRECTOR";

    const result = db.registerSchool({
      schoolName: cleanSchoolName,
      directorFirstName: cleanFirstName,
      directorLastName: cleanLastName,
      email: cleanEmail,
      password: cleanPassword,
      phone: cleanPhone,
      city: cleanCity,
      planCode: planCode || "MONTHLY",
      billingCycle: billingCycle || (planCode === "YEARLY" ? "YEARLY" : "MONTHLY"),
      role: assignedRole
    });

    if (!result.success || !result.establishment || !result.user) {
      return NextResponse.json(
        { error: result.error || "Impossible d'enregistrer l'établissement." },
        { status: 400 }
      );
    }

    const sessionUser: SessionUser = {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
      tenantId: result.establishment.id,
      establishmentName: result.establishment.name,
      establishmentCode: result.establishment.code
    };

    const token = await createSessionToken(sessionUser);

    const redirectUrl = result.user.role === "DIRECTOR" ? "/director" : "/admin";

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      establishment: result.establishment,
      redirectUrl
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de l'établissement." },
      { status: 500 }
    );
  }
}

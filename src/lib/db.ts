/**
 * ECO & FRAIS (Eco~frais) — Base de Données Multi-Tenant & Moteur Transactionnel
 * Gestion stricte du tenant_id, intégrité financière et calculs côté serveur
 */

export interface EstablishmentData {
  id: string;
  code: string;
  name: string;
  logoUrl?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  directorName: string;
  status: "ACTIVE" | "TRIAL" | "SUSPENDED" | "ARCHIVED";
  suspensionReason?: string;
  currency: string;
  timezone: string;
  createdAt: string;
}

export interface UserData {
  id: string;
  tenantId: string | null; // null uniquement pour SUPER_ADMIN
  email: string;
  passwordHash: string; // ou mot de passe en clair pour les tests
  fullName: string;
  phone?: string;
  role: "SUPER_ADMIN" | "ESTABLISHMENT_ADMIN" | "DIRECTOR" | "ACCOUNTANT" | "PARENT";
  isActive: boolean;
  parentId?: string;
  createdAt: string;
}

export interface ClassData {
  id: string;
  tenantId: string;
  name: string;
  level: "MATERNELLE" | "PRIMAIRE" | "COLLEGE" | "LYCEE";
  capacity: number;
  monthlyTuition: number;
}

export interface StudentData {
  id: string;
  tenantId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  birthDate: string;
  birthPlace: string;
  classId: string;
  parentId: string;
  address: string;
  isActive: boolean;
  academicYear?: string;
  photoUrl?: string;
}

export interface ParentData {
  id: string;
  tenantId: string;
  fullName: string;
  relationship: string;
  phone: string; // +228XXXXXXXX
  phoneSecondary?: string;
  email?: string;
  userId?: string;
}

export interface FeeStructureData {
  id: string;
  tenantId: string;
  name: string;
  amount: number; // XOF
  category: "INSCRIPTION" | "SCOLARITE" | "CANTINE" | "TRANSPORT" | "EXAMEN";
  installmentOrder: number;
  dueDate: string;
}

export interface FeeConfigData {
  id: string;
  tenantId: string;
  name: string;
  level: "MATERNELLE" | "PRIMAIRE" | "COLLEGE" | "LYCEE" | "TOUS";
  academicYear: string;
  paymentMode: "TRANCHE" | "MENSUEL" | "ANNUEL" | "MIXTE";
  annualAmount: number;
  monthlyAmount: number;
  discountAnnual: number;
  tranches: {
    trancheNumber: number;
    name: string;
    percentage: number;
    amount: number;
    dueDate: string;
  }[];
  isActive: boolean;
  createdAt: string;
}

export interface InvoiceItemData {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
}

export interface InvoiceData {
  id: string;
  tenantId: string;
  studentId: string;
  invoiceNumber: string;
  totalAmount: number; // XOF
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE";
  dueDate: string;
  items: InvoiceItemData[];
}

export interface PaymentTransactionData {
  id: string;
  tenantId: string;
  studentId: string;
  invoiceId: string;
  receiptNumber: string;
  idempotencyKey: string;
  amount: number; // XOF
  paymentMethod: "ESPECES" | "TMONEY" | "FLOOZ" | "VIREMENT" | "CHEQUE";
  referenceNumber?: string;
  receivedByUserId: string;
  receivedByName: string;
  payerName: string;
  payerPhone: string;
  notes?: string;
  status: "VALIDATED" | "CANCELLED";
  paymentDate: string;
}

export interface SubscriptionPlanData {
  id: string;
  code: "STANDARD" | "ESSENTIEL" | "PRO" | "EXCELLENCE";
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxStudents: number;
  maxUsers: number;
  features: string[];
  isActive: boolean;
}

export interface SubscriptionData {
  id: string;
  establishmentId: string;
  planId: string;
  billingCycle: "MONTHLY" | "YEARLY";
  status: "ACTIVE" | "TRIAL" | "EXPIRED" | "CANCELLED";
  startDate: string;
  endDate: string;
}

export interface SupportTicketData {
  id: string;
  tenantId: string;
  schoolName: string;
  creatorId: string;
  creatorName: string;
  subject: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  replies: {
    id: string;
    senderName: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
  }[];
}

export interface NotificationLogData {
  id: string;
  tenantId: string;
  studentId?: string;
  studentName?: string;
  recipientPhone: string;
  channel: "WHATSAPP_CLICK" | "WHATSAPP_CLOUD_API" | "SMS";
  templateCode: string;
  content: string;
  status: "PREPARED" | "SENT" | "FAILED";
  sentByName: string;
  createdAt: string;
}

export interface AuditLogData {
  id: string;
  tenantId?: string | null;
  userId?: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  createdAt: string;
}

export interface EstablishmentAlertData {
  id: string;
  tenantId: string;
  creatorId: string;
  creatorName: string;
  targetRole: "DIRECTOR" | "ACCOUNTANT" | "BOTH";
  category: "PAYMENT_DELAY" | "STUDENT_COUNT" | "CASH_DISCREPANCY" | "OTHER";
  title: string;
  description: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  resolvedAt?: string;
  resolvedByName?: string;
}

// ========================================================
// INITIALISATION DE LA BASE EN MÉMOIRE AVEC DONNÉES DU TOGO
// ========================================================

class DatabaseStore {
  establishments: EstablishmentData[] = [];
  subscriptionPlans: SubscriptionPlanData[] = [];
  subscriptions: SubscriptionData[] = [];
  users: UserData[] = [];
  classes: ClassData[] = [];
  parents: ParentData[] = [];
  students: StudentData[] = [];
  feeStructures: FeeStructureData[] = [];
  feeConfigs: FeeConfigData[] = [];
  invoices: InvoiceData[] = [];
  payments: PaymentTransactionData[] = [];
  tickets: SupportTicketData[] = [];
  notificationLogs: NotificationLogData[] = [];
  auditLogs: AuditLogData[] = [];
  alerts: EstablishmentAlertData[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Formule d'abonnement SaaS ECO & FRAIS
    this.subscriptionPlans = [
      {
        id: "plan-standard",
        code: "STANDARD",
        name: "Formule Complète ECO & FRAIS",
        description: "Accès tout-en-un : gestion scolaire, encaissements, reçus QR Code et espace parents WhatsApp",
        priceMonthly: 5000,
        priceYearly: 50000,
        maxStudents: 5000,
        maxUsers: 50,
        features: [
          "Gestion complète des élèves et des classes",
          "Encaissements de scolarité (Espèces, TMoney, Flooz)",
          "Reçus officiels infalsifiables et sécurisés",
          "Espace Parents WhatsApp sans mot de passe",
          "Comptabilité analytique & point de caisse journalier",
          "Suivi des impayés et relances automatiques",
          "Multi-profils (Direction, Caisse, Administration)",
          "Exports Excel & rapports statistiques officiels"
        ],
        isActive: true
      }
    ];

    // 2. Compte Super-Administrateur initial (Configurable par variables d'environnement)
    const superAdminEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@ecofrais.tg").trim().toLowerCase();
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD || "SuperAdmin2025!";

    this.users = [
      {
        id: "user-superadmin",
        tenantId: null,
        email: superAdminEmail,
        passwordHash: superAdminPassword,
        fullName: "Super Administrateur ECO & FRAIS",
        phone: "+228 90 00 00 01",
        role: "SUPER_ADMIN",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z"
      }
    ];

    // Initialisation propre pour la production (aucun faux eleve, parent, classe ou paiement de test)
    this.establishments = [];
    this.subscriptions = [];
    this.parents = [];
    this.classes = [];
    this.feeStructures = [];
    this.feeConfigs = [];
    this.students = [];
    this.invoices = [];
    this.payments = [];
    this.tickets = [];
    this.notificationLogs = [];
    this.auditLogs = [];
    this.alerts = [];
  }

  // ==========================================
  // MÉTHODES DE SÉLECTION MULTI-TENANT
  // ==========================================

  getEstablishment(id: string): EstablishmentData | null {
    return this.establishments.find(e => e.id === id) || null;
  }

  getAllEstablishments(): EstablishmentData[] {
    return [...this.establishments];
  }

  getEstablishmentByName(name: string): EstablishmentData | null {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    return this.establishments.find(e => 
      e.name.toLowerCase() === clean || 
      e.code.toLowerCase() === clean ||
      e.id.toLowerCase() === clean ||
      e.name.toLowerCase().includes(clean)
    ) || null;
  }

  updateEstablishmentStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "TRIAL", reason?: string): EstablishmentData | null {
    const est = this.establishments.find(e => e.id === id);
    if (!est) return null;
    est.status = status;
    if (reason !== undefined) est.suspensionReason = reason;
    return { ...est };
  }

  getUserByEmail(email: string): UserData | null {
    const cleanEmail = email.toLowerCase().trim();
    const configuredSuperAdmin = (process.env.SUPERADMIN_EMAIL || "superadmin@ecofrais.tg").trim().toLowerCase();
    if (cleanEmail === configuredSuperAdmin || cleanEmail === "superadmin@schoolpay.tg" || cleanEmail === "superadmin@ecofrais.tg" || cleanEmail === "superadmin@ecopay.tg") {
      return this.users.find(u => u.role === "SUPER_ADMIN") || null;
    }
    return this.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  }

  getUserById(id: string): UserData | null {
    return this.users.find(u => u.id === id) || null;
  }

  /**
   * GESTION DU PERSONNEL & PROFILS DE L'ÉTABLISSEMENT (DIRECTEUR, COMPTABLE, ADMIN)
   */
  getStaff(tenantId: string): UserData[] {
    return this.users.filter(u => u.tenantId === tenantId && u.role !== "PARENT");
  }

  createStaffMember(tenantId: string, data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role: "DIRECTOR" | "ACCOUNTANT" | "ESTABLISHMENT_ADMIN";
  }): { success: boolean; user?: UserData; error?: string } {
    const cleanEmail = (data.email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: "Veuillez renseigner une adresse email valide." };
    }
    const existing = this.getUserByEmail(cleanEmail);
    if (existing) {
      if (existing.tenantId === tenantId) {
        existing.fullName = data.fullName || existing.fullName;
        existing.role = data.role;
        if (data.password) existing.passwordHash = data.password;
        if (data.phone) existing.phone = data.phone;
        existing.isActive = true;
        return { success: true, user: existing };
      }
      return { success: false, error: "Cette adresse email est déjà rattachée à un autre établissement." };
    }

    const newUser: UserData = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      email: cleanEmail,
      passwordHash: data.password || "Password2025!",
      fullName: data.fullName || "Membre de l'Équipe",
      phone: data.phone || "+228 90 12 34 56",
      role: data.role,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tenantId,
      userId: newUser.id,
      userName: newUser.fullName,
      action: "STAFF_CREATED",
      entityType: "User",
      entityId: newUser.id,
      details: `Création du profil ${data.role} pour ${newUser.fullName} (${newUser.email}).`,
      createdAt: new Date().toISOString()
    });

    return { success: true, user: newUser };
  }

  deleteStaffMember(tenantId: string, userId: string): boolean {
    const idx = this.users.findIndex(u => u.id === userId && u.tenantId === tenantId);
    if (idx >= 0) {
      this.users[idx].isActive = false;
      return true;
    }
    return false;
  }

  getStudents(tenantId: string): (StudentData & { 
    className: string; 
    parentName: string; 
    parentPhone: string;
    totalDue: number;
    totalPaid: number;
    balanceRemaining: number;
    status: string;
    invoiceId?: string;
  })[] {
    return this.students
      .filter(s => s.tenantId === tenantId)
      .map(student => {
        const cls = this.classes.find(c => c.id === student.classId);
        const parent = this.parents.find(p => p.id === student.parentId);
        const invoice = this.invoices.find(inv => inv.studentId === student.id && inv.tenantId === tenantId);

        return {
          ...student,
          className: cls ? cls.name : "Non assigné",
          parentName: parent ? parent.fullName : "Inconnu",
          parentPhone: parent ? parent.phone : "",
          totalDue: invoice ? invoice.finalAmount : 0,
          totalPaid: invoice ? invoice.paidAmount : 0,
          balanceRemaining: invoice ? invoice.balanceAmount : 0,
          status: invoice ? invoice.status : "UNPAID",
          invoiceId: invoice?.id
        };
      });
  }

  getStudentById(id: string, tenantId: string) {
    const list = this.getStudents(tenantId);
    return list.find(s => s.id === id) || null;
  }

  getClasses(tenantId: string): (ClassData & { studentCount: number; totalExpected: number; totalCollected: number })[] {
    return this.classes
      .filter(c => c.tenantId === tenantId)
      .map(cls => {
        const classStudents = this.students.filter(s => s.classId === cls.id && s.tenantId === tenantId);
        const studentIds = new Set(classStudents.map(s => s.id));
        const classInvoices = this.invoices.filter(inv => studentIds.has(inv.studentId) && inv.tenantId === tenantId);

        const totalExpected = classInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
        const totalCollected = classInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

        return {
          ...cls,
          studentCount: classStudents.length,
          totalExpected,
          totalCollected
        };
      });
  }

  addClass(tenantId: string, data: {
    name: string;
    level: "MATERNELLE" | "PRIMAIRE" | "COLLEGE" | "LYCEE";
    capacity?: number;
    monthlyTuition?: number;
  }): ClassData {
    const newClass: ClassData = {
      id: `class-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      name: data.name.trim(),
      level: data.level,
      capacity: Number(data.capacity) || 45,
      monthlyTuition: Number(data.monthlyTuition) || 95000
    };
    this.classes.push(newClass);
    return newClass;
  }

  updateClass(tenantId: string, classId: string, data: Partial<ClassData>): ClassData | null {
    const cls = this.classes.find(c => c.id === classId && c.tenantId === tenantId);
    if (!cls) return null;
    if (data.name !== undefined) cls.name = data.name.trim();
    if (data.level !== undefined) cls.level = data.level;
    if (data.capacity !== undefined) cls.capacity = Number(data.capacity);
    if (data.monthlyTuition !== undefined) cls.monthlyTuition = Number(data.monthlyTuition);
    return { ...cls };
  }

  deleteClass(tenantId: string, classId: string): boolean {
    const idx = this.classes.findIndex(c => c.id === classId && c.tenantId === tenantId);
    if (idx >= 0) {
      this.classes.splice(idx, 1);
      return true;
    }
    return false;
  }

  batchAddClasses(tenantId: string, levelName: string, levelCategory: "MATERNELLE" | "PRIMAIRE" | "COLLEGE" | "LYCEE", divisions: string[], capacityPerClass: number, tuition?: number): ClassData[] {
    const created: ClassData[] = [];
    divisions.forEach(div => {
      const fullClassName = `${levelName} ${div}`.trim();
      const existing = this.classes.find(c => c.tenantId === tenantId && c.name.toLowerCase() === fullClassName.toLowerCase());
      if (!existing) {
        const cls: ClassData = {
          id: `class-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          tenantId,
          name: fullClassName,
          level: levelCategory,
          capacity: capacityPerClass || 45,
          monthlyTuition: tuition || (levelCategory === "LYCEE" ? 125000 : levelCategory === "COLLEGE" ? 105000 : 85000)
        };
        this.classes.push(cls);
        created.push(cls);
      }
    });
    return created;
  }

  getPayments(tenantId: string): (PaymentTransactionData & { 
    studentName: string; 
    matricule: string; 
    className: string;
  })[] {
    return this.payments
      .filter(p => p.tenantId === tenantId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .map(pay => {
        const student = this.students.find(s => s.id === pay.studentId);
        const cls = student ? this.classes.find(c => c.id === student.classId) : null;
        return {
          ...pay,
          studentName: student ? `${student.lastName} ${student.firstName}` : "Élève Inconnu",
          matricule: student ? student.matricule : "N/A",
          className: cls ? cls.name : "N/A"
        };
      });
  }

  getPaymentById(id: string, tenantId?: string | null): (PaymentTransactionData & {
    studentName: string;
    matricule: string;
    className: string;
    establishment: EstablishmentData | null;
    remainingBalance: number;
    totalAmount: number;
  }) | null {
    const pay = this.payments.find(p => p.id === id && (!tenantId || p.tenantId === tenantId));
    if (!pay) return null;
    const student = this.students.find(s => s.id === pay.studentId);
    const cls = student ? this.classes.find(c => c.id === student.classId) : null;
    const est = this.establishments.find(e => e.id === pay.tenantId) || null;
    const invoice = this.invoices.find(inv => inv.id === pay.invoiceId);

    return {
      ...pay,
      studentName: student ? `${student.lastName} ${student.firstName}` : "Inconnu",
      matricule: student ? student.matricule : "N/A",
      className: cls ? cls.name : "N/A",
      establishment: est,
      remainingBalance: invoice ? invoice.balanceAmount : 0,
      totalAmount: invoice ? invoice.finalAmount : pay.amount
    };
  }

  /**
   * MOTEUR FINANCIER D'ENCAISSEMENT ATOMIQUE & IDEMPOTENT
   * Règle obligatoire : Calcul serveur, déduction du solde, génération du numéro de reçu séquentiel
   */
  processPayment(params: {
    tenantId: string;
    studentId: string;
    amount: number;
    paymentMethod: "ESPECES" | "TMONEY" | "FLOOZ" | "VIREMENT" | "CHEQUE";
    referenceNumber?: string;
    receivedByUserId: string;
    receivedByName: string;
    payerName?: string;
    payerPhone?: string;
    notes?: string;
    idempotencyKey?: string;
  }): {
    success: boolean;
    payment?: PaymentTransactionData;
    error?: string;
    newBalance?: number;
  } {
    const { tenantId, studentId, amount, paymentMethod, referenceNumber, receivedByUserId, receivedByName, notes } = params;

    if (amount <= 0) {
      return { success: false, error: "Le montant du versement doit être supérieur à 0 FCFA." };
    }

    const est = this.getEstablishment(tenantId);
    if (!est) return { success: false, error: "Établissement introuvable." };
    if (est.status === "SUSPENDED") {
      return { success: false, error: "Cet établissement est actuellement suspendu. Opérations financières bloquées." };
    }

    // Vérification de l'idempotence anti double-clic
    const idempKey = params.idempotencyKey || `idem-${tenantId}-${Date.now()}-${Math.random()}`;
    const existing = this.payments.find(p => p.idempotencyKey === idempKey);
    if (existing) {
      return {
        success: true,
        payment: existing,
        newBalance: this.invoices.find(i => i.id === existing.invoiceId)?.balanceAmount
      };
    }

    // Récupérer la facture élève
    const invoice = this.invoices.find(inv => inv.studentId === studentId && inv.tenantId === tenantId);
    if (!invoice) {
      return { success: false, error: "Facture scolaire introuvable pour cet élève." };
    }

    if (amount > invoice.balanceAmount) {
      return {
        success: false,
        error: `Le montant versé (${amount} FCFA) dépasse le solde restant dû (${invoice.balanceAmount} FCFA).`
      };
    }

    // Mise à jour de la facture (calcul strict serveur)
    invoice.paidAmount += Math.round(amount);
    invoice.balanceAmount = invoice.finalAmount - invoice.paidAmount;
    if (invoice.balanceAmount === 0) {
      invoice.status = "PAID";
    } else {
      invoice.status = "PARTIAL";
    }

    // Génération du numéro de reçu séquentiel unique
    const seqNum = (this.payments.filter(p => p.tenantId === tenantId).length + 1).toString().padStart(4, "0");
    const currentYear = new Date().getFullYear();
    const receiptNumber = `REC-${currentYear}-${est.code}-${seqNum}`;

    const student = this.students.find(s => s.id === studentId);
    const parent = student ? this.parents.find(p => p.id === student.parentId) : null;

    const newPayment: PaymentTransactionData = {
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      studentId,
      invoiceId: invoice.id,
      receiptNumber,
      idempotencyKey: idempKey,
      amount: Math.round(amount),
      paymentMethod,
      referenceNumber: referenceNumber || (paymentMethod === "ESPECES" ? "GUICHET" : "N/A"),
      receivedByUserId,
      receivedByName,
      payerName: params.payerName || parent?.fullName || "Parent d'élève",
      payerPhone: params.payerPhone || parent?.phone || "",
      notes,
      status: "VALIDATED",
      paymentDate: new Date().toISOString()
    };

    this.payments.unshift(newPayment);

    // Audit log
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tenantId,
      userId: receivedByUserId,
      userName: receivedByName,
      action: "PAYMENT_CREATED",
      entityType: "PaymentTransaction",
      entityId: newPayment.id,
      details: `Encaissement de ${amount} FCFA pour ${student?.lastName} ${student?.firstName}. Reçu: ${receiptNumber}. Nouveau solde: ${invoice.balanceAmount} FCFA.`,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      payment: newPayment,
      newBalance: invoice.balanceAmount
    };
  }

  /**
   * STATISTIQUES FINANCIÈRES ÉCOLE (Pour Directeur, Admin & Comptable)
   */
  getFinancialStats(tenantId: string) {
    const schoolInvoices = this.invoices.filter(i => i.tenantId === tenantId);
    const schoolPayments = this.payments.filter(p => p.tenantId === tenantId && p.status === "VALIDATED");
    const schoolStudents = this.students.filter(s => s.tenantId === tenantId);

    const totalExpected = schoolInvoices.reduce((acc, i) => acc + i.finalAmount, 0);
    const totalCollected = schoolInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
    const totalRemaining = totalExpected - totalCollected;

    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const fullyPaidCount = schoolInvoices.filter(i => i.status === "PAID").length;
    const partialPaidCount = schoolInvoices.filter(i => i.status === "PARTIAL").length;
    const unpaidCount = schoolInvoices.filter(i => i.status === "UNPAID" || i.status === "OVERDUE").length;

    // Répartition par mode de paiement
    const paymentsByMethod: Record<string, number> = {
      ESPECES: 0,
      TMONEY: 0,
      FLOOZ: 0,
      VIREMENT: 0,
      CHEQUE: 0
    };

    schoolPayments.forEach(p => {
      if (paymentsByMethod[p.paymentMethod] !== undefined) {
        paymentsByMethod[p.paymentMethod] += p.amount;
      }
    });

    return {
      totalExpected,
      totalCollected,
      totalRemaining,
      collectionRate,
      studentCount: schoolStudents.length,
      fullyPaidCount,
      partialPaidCount,
      unpaidCount,
      paymentsByMethod
    };
  }

  /**
   * STATISTIQUES SAAS GLOBALES (Pour Super-Administrateur)
   */
  getPlatformStats() {
    const activeSchools = this.establishments.filter(e => e.status === "ACTIVE").length;
    const suspendedSchools = this.establishments.filter(e => e.status === "SUSPENDED").length;
    const totalStudents = this.students.length;
    const totalUsers = this.users.length;

    // Calcul du MRR (Monthly Recurring Revenue) de la plateforme en XOF
    let platformMRR = 0;
    this.subscriptions.forEach(sub => {
      const plan = this.subscriptionPlans.find(p => p.id === sub.planId);
      if (plan && sub.status === "ACTIVE") {
        if (sub.billingCycle === "YEARLY") {
          platformMRR += Math.round(plan.priceYearly / 12);
        } else {
          platformMRR += plan.priceMonthly;
        }
      }
    });

    const openTickets = this.tickets.filter(t => t.status !== "RESOLVED" && t.status !== "CLOSED").length;

    return {
      totalEstablishments: this.establishments.length,
      activeSchools,
      suspendedSchools,
      totalStudents,
      totalUsers,
      platformMRR,
      openTickets
    };
  }

  /**
   * ESPACE PARENT : Récupérer les enfants liés à un parent donné
   */
  getParentChildren(parentId: string, tenantId: string) {
    const parent = this.parents.find(p => p.id === parentId);
    if (!parent) return [];

    const children = this.students.filter(s => s.parentId === parentId && s.tenantId === tenantId);

    return children.map(child => {
      const cls = this.classes.find(c => c.id === child.classId);
      const invoice = this.invoices.find(i => i.studentId === child.id && i.tenantId === tenantId);
      const childPayments = this.payments.filter(p => p.studentId === child.id && p.tenantId === tenantId);

      return {
        ...child,
        className: cls ? cls.name : "N/A",
        invoice: invoice || null,
        payments: childPayments
      };
    });
  }

  /**
   * Recherche de profil parent par numéro de téléphone (WhatsApp / Togo)
   */
  findParentByPhone(phoneInput: string): ParentData | null {
    if (!phoneInput) return null;
    const digits = phoneInput.replace(/\D/g, "");
    if (!digits) return null;
    const last8 = digits.slice(-8);

    const parent = this.parents.find(p => {
      const pDigits = (p.phone || "").replace(/\D/g, "");
      const pSecDigits = (p.phoneSecondary || "").replace(/\D/g, "");
      return pDigits.endsWith(last8) || pSecDigits.endsWith(last8);
    });

    return parent || null;
  }

  /**
   * AJOUTER UN ÉLÈVE
   */
  addStudent(data: {
    tenantId: string;
    firstName: string;
    lastName: string;
    gender: "M" | "F";
    birthDate: string;
    birthPlace: string;
    classId: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    address: string;
  }) {
    // 1. Chercher ou créer le parent
    let parent = this.parents.find(p => p.phone === data.parentPhone && p.tenantId === data.tenantId);
    if (!parent) {
      parent = {
        id: `parent-${Date.now()}`,
        tenantId: data.tenantId,
        fullName: data.parentName,
        relationship: "Parent d'élève",
        phone: data.parentPhone,
        email: data.parentEmail
      };
      this.parents.push(parent);
    }

    // 2. Générer matricule
    const est = this.getEstablishment(data.tenantId);
    const estCode = est?.code.split("-")[0] || "SCH";
    const studentCount = this.students.filter(s => s.tenantId === data.tenantId).length + 1;
    const matricule = `MAT-${new Date().getFullYear()}-${estCode}-${studentCount.toString().padStart(3, "0")}`;

    const student: StudentData = {
      id: `student-${Date.now()}`,
      tenantId: data.tenantId,
      matricule,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      birthDate: data.birthDate,
      birthPlace: data.birthPlace,
      classId: data.classId,
      parentId: parent.id,
      address: data.address,
      isActive: true
    };
    this.students.push(student);

    // 3. Créer automatiquement la facture associée
    const cls = this.classes.find(c => c.id === data.classId);
    const baseTuition = cls ? cls.monthlyTuition : 100000;

    const invoice: InvoiceData = {
      id: `inv-${Date.now()}`,
      tenantId: data.tenantId,
      studentId: student.id,
      invoiceNumber: `FAC-${new Date().getFullYear()}-${studentCount.toString().padStart(3, "0")}`,
      totalAmount: baseTuition,
      discountAmount: 0,
      finalAmount: baseTuition,
      paidAmount: 0,
      balanceAmount: baseTuition,
      status: "UNPAID",
      dueDate: "2024-12-15",
      items: [
        { id: `item-${Date.now()}-1`, description: "Scolarité Tranche 1 (30%)", amount: Math.round(baseTuition * 0.3), dueDate: "2024-10-15" },
        { id: `item-${Date.now()}-2`, description: "Scolarité Tranche 2 (40%)", amount: Math.round(baseTuition * 0.4), dueDate: "2024-12-15" },
        { id: `item-${Date.now()}-3`, description: "Scolarité Tranche 3 (30%)", amount: Math.round(baseTuition * 0.3), dueDate: "2025-02-15" }
      ]
    };
    this.invoices.push(invoice);

    return student;
  }

  bulkAddStudents(tenantId: string, items: {
    className: string;
    academicYear?: string;
    matricule?: string;
    lastName: string;
    firstName: string;
    gender?: "M" | "F";
    birthDate?: string;
    parentName?: string;
    parentPhone?: string;
    tuitionAmount?: number;
  }[]): { count: number; created: StudentData[] } {
    const est = this.getEstablishment(tenantId);
    const estCode = est?.code.split("-")[0] || "SCH";
    const year = new Date().getFullYear();
    const created: StudentData[] = [];

    items.forEach((item, index) => {
      const cleanLastName = (item.lastName || "").trim();
      const cleanFirstName = (item.firstName || "").trim();
      if (!cleanLastName && !cleanFirstName) return;

      const rawClassName = (item.className || "6ème A").trim();
      let cls = this.classes.find(c => c.tenantId === tenantId && c.name.toLowerCase() === rawClassName.toLowerCase());
      if (!cls) {
        let level: "MATERNELLE" | "PRIMAIRE" | "COLLEGE" | "LYCEE" = "COLLEGE";
        if (rawClassName.toLowerCase().includes("cp") || rawClassName.toLowerCase().includes("ce") || rawClassName.toLowerCase().includes("cm")) {
          level = "PRIMAIRE";
        } else if (rawClassName.toLowerCase().includes("sec") || rawClassName.toLowerCase().includes("prem") || rawClassName.toLowerCase().includes("term")) {
          level = "LYCEE";
        }
        cls = {
          id: `class-${Date.now()}-${index}`,
          tenantId,
          name: rawClassName,
          level,
          capacity: 45,
          monthlyTuition: Number(item.tuitionAmount) || 100000
        };
        this.classes.push(cls);
      }

      const cleanPhone = (item.parentPhone || "+228 90 00 00 00").trim();
      const cleanParentName = (item.parentName || `Parent de ${cleanLastName}`).trim();
      let parent = this.parents.find(p => p.tenantId === tenantId && p.phone === cleanPhone);
      if (!parent) {
        parent = {
          id: `parent-${Date.now()}-${index}`,
          tenantId,
          fullName: cleanParentName,
          relationship: "Parent / Tuteur",
          phone: cleanPhone
        };
        this.parents.push(parent);
      }

      const studentCount = this.students.filter(s => s.tenantId === tenantId).length + 1;
      const matricule = item.matricule && item.matricule.trim() 
        ? item.matricule.trim() 
        : `MAT-${year}-${estCode}-${studentCount.toString().padStart(3, "0")}`;

      const student: StudentData = {
        id: `student-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        matricule,
        lastName: cleanLastName || "Élève",
        firstName: cleanFirstName || "Sans prénom",
        gender: (item.gender?.toUpperCase() === "F" ? "F" : "M"),
        birthDate: item.birthDate || "2013-05-10",
        birthPlace: "Lomé",
        classId: cls.id,
        parentId: parent.id,
        address: "Lomé, Togo",
        academicYear: item.academicYear || "2024-2025",
        isActive: true
      };
      this.students.push(student);
      created.push(student);

      const tuition = Number(item.tuitionAmount) || cls.monthlyTuition || 100000;
      const invoice: InvoiceData = {
        id: `inv-${Date.now()}-${index}`,
        tenantId,
        studentId: student.id,
        invoiceNumber: `FAC-${year}-${studentCount.toString().padStart(3, "0")}`,
        totalAmount: tuition,
        discountAmount: 0,
        finalAmount: tuition,
        paidAmount: 0,
        balanceAmount: tuition,
        status: "UNPAID",
        dueDate: "2024-12-15",
        items: [
          { id: `item-${Date.now()}-${index}-1`, description: "Scolarité Tranche 1 (40%)", amount: Math.round(tuition * 0.4), dueDate: "2024-10-15" },
          { id: `item-${Date.now()}-${index}-2`, description: "Scolarité Tranche 2 (35%)", amount: Math.round(tuition * 0.35), dueDate: "2024-12-15" },
          { id: `item-${Date.now()}-${index}-3`, description: "Scolarité Tranche 3 (25%)", amount: Math.round(tuition * 0.25), dueDate: "2025-02-15" }
        ]
      };
      this.invoices.push(invoice);
    });

    return { count: created.length, created };
  }

  /**
   * TICKETS DE SUPPORT SAAS
   */
  createTicket(data: { tenantId: string; creatorId: string; subject: string; message: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }) {
    const est = this.getEstablishment(data.tenantId);
    const creator = this.getUserById(data.creatorId);

    const ticket: SupportTicketData = {
      id: `ticket-${Date.now()}`,
      tenantId: data.tenantId,
      schoolName: est?.name || "Établissement inconnu",
      creatorId: data.creatorId,
      creatorName: creator?.fullName || "Administrateur",
      subject: data.subject,
      message: data.message,
      priority: data.priority,
      status: "NEW",
      createdAt: new Date().toISOString(),
      replies: []
    };
    this.tickets.unshift(ticket);
    return ticket;
  }

  replyTicket(ticketId: string, senderName: string, message: string, isAdmin: boolean) {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return null;
    ticket.replies.push({
      id: `reply-${Date.now()}`,
      senderName,
      message,
      isAdmin,
      createdAt: new Date().toISOString()
    });
    if (isAdmin && ticket.status === "NEW") {
      ticket.status = "IN_PROGRESS";
    }
    return ticket;
  }

  /**
   * INSCRIPTION D'UN NOUVEL ÉTABLISSEMENT PAR UN DIRECTEUR / FONDATEUR
   */
  registerSchool(data: {
    schoolName: string;
    directorFirstName: string;
    directorLastName: string;
    email: string;
    password: string;
    phone: string;
    city?: string;
    planCode?: string;
    billingCycle?: "MONTHLY" | "YEARLY";
    role?: "DIRECTOR" | "ESTABLISHMENT_ADMIN";
  }): {
    success: boolean;
    establishment?: EstablishmentData;
    user?: UserData;
    error?: string;
  } {
    const existing = this.getUserByEmail(data.email);
    if (existing) {
      // Connecter l'utilisateur existant et mettre à jour le mot de passe
      existing.passwordHash = data.password;
      const existingEst = this.getEstablishment(existing.tenantId || "") || this.establishments[0];
      return { success: true, establishment: existingEst, user: existing };
    }

    const tenantId = `tenant-${Date.now()}`;
    const cleanPrefix = data.schoolName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "SCH") || "SCH";
    const code = `${cleanPrefix}-${Math.floor(100 + Math.random() * 900)}`;

    const establishment: EstablishmentData = {
      id: tenantId,
      code,
      name: data.schoolName,
      address: "Quartier Administratif",
      city: data.city || "Lomé",
      country: "Togo",
      phone: data.phone || "+228 90 12 34 56",
      email: data.email,
      directorName: `${data.directorFirstName} ${data.directorLastName}`.trim(),
      status: "ACTIVE",
      currency: "XOF",
      timezone: "Africa/Lome",
      createdAt: new Date().toISOString()
    };
    this.establishments.push(establishment);

    // Classes initiales créées par défaut
    const defaultClasses: ClassData[] = [
      { id: `cls-${Date.now()}-1`, tenantId, name: "CP1 A", level: "PRIMAIRE", capacity: 35, monthlyTuition: 85000 },
      { id: `cls-${Date.now()}-2`, tenantId, name: "CM2 A", level: "PRIMAIRE", capacity: 40, monthlyTuition: 95000 },
      { id: `cls-${Date.now()}-3`, tenantId, name: "6ème A", level: "COLLEGE", capacity: 45, monthlyTuition: 100000 },
      { id: `cls-${Date.now()}-4`, tenantId, name: "3ème B", level: "COLLEGE", capacity: 45, monthlyTuition: 115000 },
      { id: `cls-${Date.now()}-5`, tenantId, name: "Terminale C", level: "LYCEE", capacity: 35, monthlyTuition: 125000 }
    ];
    this.classes.push(...defaultClasses);

    // Formule d'abonnement rattachée (5 000 FCFA/mois ou 50 000 FCFA/an)
    const isYearly = data.billingCycle === "YEARLY" || data.planCode === "YEARLY";
    const sub: SubscriptionData = {
      id: `sub-${Date.now()}`,
      establishmentId: tenantId,
      planId: "plan-standard",
      billingCycle: isYearly ? "YEARLY" : "MONTHLY",
      status: "ACTIVE",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 3600 * 1000).toISOString()
    };
    this.subscriptions.push(sub);

    // Création du compte utilisateur (Admin Établissement ou Directeur)
    const assignedRole = data.role || "ESTABLISHMENT_ADMIN";
    const user: UserData = {
      id: `user-${Date.now()}`,
      tenantId,
      email: data.email,
      passwordHash: data.password,
      fullName: `${data.directorFirstName} ${data.directorLastName}`.trim(),
      phone: data.phone || "+228 90 12 34 56",
      role: assignedRole,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.users.push(user);

    // Journal d'audit
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tenantId,
      userId: user.id,
      userName: user.fullName,
      action: "SCHOOL_REGISTERED",
      entityType: "Establishment",
      entityId: tenantId,
      details: `Création de l'établissement « ${data.schoolName} » (${code}) par ${user.fullName}.`,
      createdAt: new Date().toISOString()
    });

    return { success: true, establishment, user };
  }

  /**
   * GESTION DE LA FIXATION DES PRIX D'ÉCOLAGE (TRANCHE, MENSUEL, ANNUEL)
   */
  getFeeConfigs(tenantId: string): FeeConfigData[] {
    if (!this.feeConfigs) this.feeConfigs = [];
    return this.feeConfigs.filter(f => f.tenantId === tenantId);
  }

  saveFeeConfig(tenantId: string, data: Partial<FeeConfigData>): FeeConfigData {
    if (!this.feeConfigs) this.feeConfigs = [];
    const hasValidId = data.id && typeof data.id === "string" && data.id.trim().length > 0;
    const existingIndex = hasValidId ? this.feeConfigs.findIndex(f => f.id === data.id && f.tenantId === tenantId) : -1;
    
    const annual = Number(data.annualAmount) || 100000;
    const monthly = Number(data.monthlyAmount) || Math.round(annual / 10);
    const discount = Number(data.discountAnnual) || 0;

    let tranches = data.tranches;
    if (!tranches || tranches.length === 0) {
      tranches = [
        { trancheNumber: 1, name: "Tranche 1 (Rentrée Octobre)", percentage: 40, amount: Math.round(annual * 0.4), dueDate: "2024-10-15" },
        { trancheNumber: 2, name: "Tranche 2 (Deuxième Trimestre)", percentage: 35, amount: Math.round(annual * 0.35), dueDate: "2024-12-15" },
        { trancheNumber: 3, name: "Tranche 3 (Solde Troisième Trimestre)", percentage: 25, amount: Math.round(annual * 0.25), dueDate: "2025-02-15" }
      ];
    }

    const config: FeeConfigData = {
      id: hasValidId ? data.id! : `fee-cfg-${Date.now()}`,
      tenantId,
      name: data.name || "Grille Tarifaire d'Écolage",
      level: data.level || "TOUS",
      academicYear: data.academicYear || "2024-2025",
      paymentMode: data.paymentMode || "MIXTE",
      annualAmount: annual,
      monthlyAmount: monthly,
      discountAnnual: discount,
      tranches,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.feeConfigs[existingIndex] = config;
    } else {
      this.feeConfigs.push(config);
    }
    return config;
  }

  deleteFeeConfig(tenantId: string, id: string): boolean {
    if (!this.feeConfigs) this.feeConfigs = [];
    const idx = this.feeConfigs.findIndex(f => f.id === id && f.tenantId === tenantId);
    if (idx >= 0) {
      this.feeConfigs.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * SIGNALEMENTS & ALERTES INTERNES (Admin -> Directeur & Comptable)
   */
  getAlerts(tenantId: string, targetRole?: string): EstablishmentAlertData[] {
    if (!this.alerts) this.alerts = [];
    return this.alerts
      .filter(a => a.tenantId === tenantId)
      .filter(a => {
        if (!targetRole || targetRole === "ESTABLISHMENT_ADMIN" || targetRole === "SUPER_ADMIN") return true;
        return a.targetRole === targetRole || a.targetRole === "BOTH";
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createAlert(data: {
    tenantId: string;
    creatorId: string;
    creatorName: string;
    targetRole: "DIRECTOR" | "ACCOUNTANT" | "BOTH";
    category: "PAYMENT_DELAY" | "STUDENT_COUNT" | "CASH_DISCREPANCY" | "OTHER";
    title: string;
    description: string;
    priority?: "NORMAL" | "HIGH" | "URGENT";
  }): EstablishmentAlertData {
    if (!this.alerts) this.alerts = [];
    const newAlert: EstablishmentAlertData = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: data.tenantId,
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      targetRole: data.targetRole,
      category: data.category,
      title: data.title,
      description: data.description,
      priority: data.priority || "NORMAL",
      status: "OPEN",
      createdAt: new Date().toISOString()
    };
    this.alerts.unshift(newAlert);

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tenantId: data.tenantId,
      userId: data.creatorId,
      userName: data.creatorName,
      action: "ALERT_SIGNALED",
      entityType: "EstablishmentAlert",
      entityId: newAlert.id,
      details: `Signalement émis vers ${data.targetRole} : ${data.title}`,
      createdAt: new Date().toISOString()
    });

    return newAlert;
  }

  resolveAlert(id: string, resolvedByName?: string): EstablishmentAlertData | null {
    if (!this.alerts) this.alerts = [];
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = "RESOLVED";
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedByName = resolvedByName || "Membre de l'équipe";
      return alert;
    }
    return null;
  }

  /**
   * LOG DE NOTIFICATION WHATSAPP
   */
  logNotification(log: Omit<NotificationLogData, "id" | "createdAt">) {
    const newLog: NotificationLogData = {
      ...log,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.notificationLogs.unshift(newLog);
    return newLog;
  }
}

// Instance globale singleton résiliente
const globalForDb = globalThis as unknown as { schoolpayDb: DatabaseStore };

export const db = globalForDb.schoolpayDb || new DatabaseStore();

// Synchronisation immédiate du prototype et des données lors des rechargements à chaud
if (globalForDb.schoolpayDb) {
  Object.setPrototypeOf(globalForDb.schoolpayDb, DatabaseStore.prototype);
  if (!globalForDb.schoolpayDb.feeConfigs) {
    globalForDb.schoolpayDb.feeConfigs = [];
  }
  if (!globalForDb.schoolpayDb.alerts) {
    globalForDb.schoolpayDb.alerts = [];
  }
}

if (process.env.NODE_ENV !== "production") globalForDb.schoolpayDb = db;

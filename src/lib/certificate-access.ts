type CertificateAccessUser = {
  role: string;
  permissions?: readonly string[];
  staffId?: string;
};

export function canManageStudentCertificates(user: CertificateAccessUser) {
  if (user.staffId) {
    return Boolean(user.permissions?.includes("*") || user.permissions?.includes("certificates.view"));
  }

  return ["ADMIN", "SUPER_ADMIN", "STUDENT_MANAGER"].includes(user.role);
}

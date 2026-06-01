function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'serhiosidorovich@gmail.com')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminUser(user) {
  return !!user?.email && getAdminEmails().includes(user.email.toLowerCase());
}

function sanitizeEmployee(employee) {
  if (!employee) return employee;
  const { telegramChatId, ...employeeData } = employee;
  return { ...employeeData, hasTelegram: !!telegramChatId };
}

async function getAccessibleEmployee(prisma, employeeId, user) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return null;
  if (!isAdminUser(user) && employee.userId !== user.id) return null;
  return employee;
}

async function getAccessibleInventoryItem(prisma, inventoryId, user) {
  const inventoryItem = await prisma.inventory.findUnique({ where: { id: inventoryId } });
  if (!inventoryItem) return null;

  const employee = await getAccessibleEmployee(prisma, inventoryItem.employeeId, user);
  if (!employee) return null;

  return inventoryItem;
}

module.exports = {
  getAccessibleEmployee,
  getAccessibleInventoryItem,
  isAdminUser,
  sanitizeEmployee
};

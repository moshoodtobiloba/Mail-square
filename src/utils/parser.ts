export function parseEmailNames(email: string) {
  if (!email || !email.includes('@')) return { firstName: '', lastName: '' };
  
  let [localPart, domainPart] = email.split('@');
  domainPart = domainPart.split('.')[0];
  
  const cleanString = (str: string) => str.replace(/[0-9]/g, '');
  
  let firstName = cleanString(localPart);
  let lastName = cleanString(domainPart);
  
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  
  firstName = firstName ? capitalize(firstName) : '';
  lastName = lastName ? capitalize(lastName) : '';
  
  if (!lastName) lastName = '';

  return { firstName, lastName };
}

export default {
  name: 'accountHolder',
  title: 'Account Holder',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity & Login', default: true },
    { name: 'personal', title: 'Personal' },
    { name: 'address', title: 'Address' },
    { name: 'bank', title: 'Bank' },
    { name: 'security', title: 'Security' },
    { name: 'dashboard', title: 'Dashboard' },
    { name: 'advisory', title: 'Advisory Account' },
  ],
  fields: [
    { name: 'userId', title: 'User ID', type: 'string', readOnly: true, group: 'identity' },
    { name: 'firstName', title: 'First Name', type: 'string', group: 'identity' },
    { name: 'middleName', title: 'Middle Name', type: 'string', group: 'identity' },
    { name: 'lastName', title: 'Last Name', type: 'string', group: 'identity' },
    { name: 'fullName', title: 'Full Name', type: 'string', readOnly: true, group: 'identity' },
    { name: 'email', title: 'Email', type: 'string', group: 'identity' },
    { name: 'accountNumber', title: 'Account Number', type: 'string', readOnly: true, group: 'identity' },
    { name: 'accountType', title: 'Account Type', type: 'string', group: 'identity' },
    { name: 'createdAt', title: 'Created At', type: 'datetime', readOnly: true, group: 'identity' },
    { name: 'passwordHash', title: 'Password Hash', type: 'string', readOnly: true, hidden: true, group: 'identity' },

    { name: 'dob', title: 'Date of Birth', type: 'string', group: 'personal' },
    { name: 'phone', title: 'Phone', type: 'string', group: 'personal' },
    { name: 'driversLicense', title: "Driver's License / ID", type: 'string', group: 'personal' },
    { name: 'dlState', title: 'Issuing State', type: 'string', group: 'personal' },
    { name: 'ssn', title: 'SSN / Tax ID', type: 'string', group: 'personal' },

    { name: 'street', title: 'Street', type: 'string', group: 'address' },
    { name: 'apt', title: 'Apt / Suite', type: 'string', group: 'address' },
    { name: 'city', title: 'City', type: 'string', group: 'address' },
    { name: 'stateAddress', title: 'State', type: 'string', group: 'address' },
    { name: 'zip', title: 'ZIP', type: 'string', group: 'address' },
    { name: 'country', title: 'Country', type: 'string', group: 'address' },

    { name: 'bankAcctType', title: 'Bank Account Type', type: 'string', group: 'bank' },
    { name: 'routingNumber', title: 'Routing Number', type: 'string', group: 'bank' },
    { name: 'bankAccountNumber', title: 'Bank Account Number', type: 'string', group: 'bank' },
    { name: 'bankName', title: 'Bank Name', type: 'string', group: 'bank' },

    { name: 'secImage', title: 'Security Image', type: 'string', group: 'security' },
    { name: 'imageCaption', title: 'Image Caption', type: 'string', group: 'security' },
    { name: 'passwordReminder', title: 'Password Reminder', type: 'string', group: 'security' },
    { name: 'secQ1', title: 'Security Question 1', type: 'string', group: 'security' },
    { name: 'secA1', title: 'Answer 1', type: 'string', group: 'security' },
    { name: 'secQ2', title: 'Security Question 2', type: 'string', group: 'security' },
    { name: 'secA2', title: 'Answer 2', type: 'string', group: 'security' },
    { name: 'secQ3', title: 'Security Question 3', type: 'string', group: 'security' },
    { name: 'secA3', title: 'Answer 3', type: 'string', group: 'security' },

    { name: 'portfolioValue', title: 'Total Portfolio Value', type: 'number', group: 'dashboard' },
    { name: 'interestEarnedYTD', title: 'Interest Earned (YTD)', type: 'number', group: 'dashboard' },
    { name: 'pendingOrders', title: 'Pending Orders', type: 'number', group: 'dashboard' },
    {
      name: 'accounts',
      title: 'Accounts',
      type: 'array',
      group: 'dashboard',
      of: [
        {
          type: 'object',
          name: 'accountItem',
          fields: [
            { name: 'name', title: 'Name', type: 'string' },
            { name: 'mask', title: 'Masked Number', type: 'string' },
            { name: 'balance', title: 'Balance', type: 'number' },
          ],
          preview: {
            select: { title: 'name', subtitle: 'mask' },
          },
        },
      ],
    },
    { name: 'eeBondRate', title: 'Current EE Bond Rate', type: 'string', group: 'dashboard' },
    { name: 'iBondRate', title: 'Current I Bond Rate', type: 'string', group: 'dashboard' },
    { name: 'portfolioYield', title: 'Portfolio Yield', type: 'string', group: 'dashboard' },
    { name: 'interestThisYear', title: 'Interest This Year', type: 'number', group: 'dashboard' },
    {
      name: 'advisoryDetails',
      title: 'Advisory Account Details',
      type: 'object',
      group: 'advisory',
      options: { collapsible: true, collapsed: true },
      fields: [
        { name: 'firmName', title: 'Firm Name', type: 'string' },
        { name: 'shellCompany', title: 'Shell Company', type: 'string' },
        { name: 'regNumber', title: 'Registration Number', type: 'string' },
        { name: 'jurisdiction', title: 'Jurisdiction', type: 'string' },
        { name: 'agent', title: 'Registered Agent', type: 'string' },
        { name: 'incorporationDate', title: 'Incorporation Date', type: 'string' },
      ],
    },
  ],
  preview: {
    select: {
      first: 'firstName',
      last: 'lastName',
      email: 'email',
      account: 'accountNumber',
    },
    prepare({ first, last, email, account }) {
      const name = [first, last].filter(Boolean).join(' ').trim();
      return {
        title: name || email || 'Unnamed account',
        subtitle: [email, account].filter(Boolean).join(' · '),
      };
    },
  },
};

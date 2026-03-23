// Comprehensive expense categories with id, name, emoji icon, and group
export const EXPENSE_CATEGORIES_DATA = [
  // 🍽️ Food & Dining
  { id: "groceries", name: "Groceries", icon: "🛒", group: "Food & Dining" },
  { id: "restaurants", name: "Restaurants", icon: "🍽️", group: "Food & Dining" },
  { id: "cafe", name: "Cafe & Coffee", icon: "☕", group: "Food & Dining" },
  { id: "snacks", name: "Snacks", icon: "🍿", group: "Food & Dining" },
  { id: "beverages", name: "Beverages & Drinks", icon: "🥤", group: "Food & Dining" },

  // 🏠 Housing & Household
  { id: "rent", name: "Rent", icon: "🏠", group: "Housing & Household" },
  { id: "mortgage", name: "Mortgage", icon: "🏦", group: "Housing & Household" },
  { id: "electricity", name: "Electricity", icon: "⚡", group: "Housing & Household" },
  { id: "water", name: "Water", icon: "💧", group: "Housing & Household" },
  { id: "gas_utility", name: "Gas (Utility)", icon: "🔥", group: "Housing & Household" },
  { id: "internet", name: "Internet & WiFi", icon: "🌐", group: "Housing & Household" },
  { id: "phone_bill", name: "Phone Bill", icon: "📱", group: "Housing & Household" },
  { id: "home_maintenance", name: "Home Maintenance", icon: "🔧", group: "Housing & Household" },
  { id: "furniture", name: "Furniture & Appliances", icon: "🛋️", group: "Housing & Household" },
  { id: "cleaning", name: "Cleaning & Laundry", icon: "🧹", group: "Housing & Household" },
  { id: "home_insurance", name: "Home Insurance", icon: "🏡", group: "Housing & Household" },

  // 🚗 Transportation
  { id: "fuel", name: "Fuel & Petrol", icon: "⛽", group: "Transportation" },
  { id: "public_transport", name: "Public Transport", icon: "🚌", group: "Transportation" },
  { id: "cab_ride", name: "Cab & Ride Share", icon: "🚕", group: "Transportation" },
  { id: "parking", name: "Parking", icon: "🅿️", group: "Transportation" },
  { id: "tolls", name: "Tolls & Charges", icon: "🛣️", group: "Transportation" },
  { id: "vehicle_maintenance", name: "Vehicle Maintenance", icon: "🔩", group: "Transportation" },
  { id: "vehicle_insurance", name: "Vehicle Insurance", icon: "🚗", group: "Transportation" },
  { id: "vehicle_emi", name: "Vehicle EMI", icon: "🏎️", group: "Transportation" },
  { id: "flights", name: "Flights", icon: "✈️", group: "Transportation" },
  { id: "train", name: "Train & Metro", icon: "🚆", group: "Transportation" },

  // 🛍️ Shopping & Lifestyle
  { id: "clothing", name: "Clothing & Apparel", icon: "👕", group: "Shopping & Lifestyle" },
  { id: "footwear", name: "Footwear", icon: "👟", group: "Shopping & Lifestyle" },
  { id: "accessories", name: "Accessories & Jewelry", icon: "💍", group: "Shopping & Lifestyle" },
  { id: "electronics", name: "Electronics & Gadgets", icon: "💻", group: "Shopping & Lifestyle" },
  { id: "beauty", name: "Beauty & Personal Care", icon: "💄", group: "Shopping & Lifestyle" },
  { id: "haircare", name: "Haircut & Salon", icon: "💇", group: "Shopping & Lifestyle" },
  { id: "gifts", name: "Gifts & Donations", icon: "🎁", group: "Shopping & Lifestyle" },
  { id: "books", name: "Books & Stationery", icon: "📚", group: "Shopping & Lifestyle" },
  { id: "online_shopping", name: "Online Shopping", icon: "🛍️", group: "Shopping & Lifestyle" },

  // 🎬 Entertainment & Leisure
  { id: "movies", name: "Movies & Cinema", icon: "🎬", group: "Entertainment & Leisure" },
  { id: "streaming", name: "Streaming Services", icon: "📺", group: "Entertainment & Leisure" },
  { id: "music", name: "Music & Concerts", icon: "🎵", group: "Entertainment & Leisure" },
  { id: "gaming", name: "Gaming", icon: "🎮", group: "Entertainment & Leisure" },
  { id: "sports", name: "Sports & Fitness", icon: "🏋️", group: "Entertainment & Leisure" },
  { id: "gym", name: "Gym & Memberships", icon: "🏃", group: "Entertainment & Leisure" },
  { id: "hobbies", name: "Hobbies & Crafts", icon: "🎨", group: "Entertainment & Leisure" },
  { id: "vacation", name: "Vacation & Travel", icon: "🏖️", group: "Entertainment & Leisure" },
  { id: "hotel", name: "Hotel & Accommodation", icon: "🏨", group: "Entertainment & Leisure" },
  { id: "events", name: "Events & Parties", icon: "🎉", group: "Entertainment & Leisure" },
  { id: "amusement", name: "Amusement & Theme Parks", icon: "🎢", group: "Entertainment & Leisure" },

  // 📱 Subscriptions & Digital
  { id: "app_subscriptions", name: "App Subscriptions", icon: "📲", group: "Subscriptions & Digital" },
  { id: "cloud_storage", name: "Cloud & Storage", icon: "☁️", group: "Subscriptions & Digital" },
  { id: "software", name: "Software & Tools", icon: "🖥️", group: "Subscriptions & Digital" },
  { id: "news_magazines", name: "News & Magazines", icon: "📰", group: "Subscriptions & Digital" },

  // 🏥 Health & Medical
  { id: "doctor", name: "Doctor & Consultation", icon: "👨‍⚕️", group: "Health & Medical" },
  { id: "medicine", name: "Medicine & Pharmacy", icon: "💊", group: "Health & Medical" },
  { id: "hospital", name: "Hospital & Lab Tests", icon: "🏥", group: "Health & Medical" },
  { id: "dental", name: "Dental Care", icon: "🦷", group: "Health & Medical" },
  { id: "eye_care", name: "Eye Care & Optical", icon: "👓", group: "Health & Medical" },
  { id: "health_insurance", name: "Health Insurance", icon: "🩺", group: "Health & Medical" },
  { id: "mental_health", name: "Mental Health & Therapy", icon: "🧠", group: "Health & Medical" },

  // 🎓 Education
  { id: "tuition", name: "Tuition & School Fees", icon: "🎓", group: "Education" },
  { id: "courses", name: "Online Courses", icon: "💻", group: "Education" },
  { id: "coaching", name: "Coaching & Tutoring", icon: "📖", group: "Education" },
  { id: "exam_fees", name: "Exam & Certification Fees", icon: "📝", group: "Education" },
  { id: "workshops", name: "Workshops & Seminars", icon: "🎤", group: "Education" },

  // 💰 Financial & Payments
  { id: "emi", name: "EMI Payment", icon: "🏧", group: "Financial & Payments" },
  { id: "loan_repayment", name: "Loan Repayment", icon: "💳", group: "Financial & Payments" },
  { id: "credit_card_bill", name: "Credit Card Bill", icon: "💳", group: "Financial & Payments" },
  { id: "income_tax", name: "Income Tax", icon: "🧾", group: "Financial & Payments" },
  { id: "property_tax", name: "Property Tax", icon: "🏘️", group: "Financial & Payments" },
  { id: "life_insurance", name: "Life Insurance", icon: "🛡️", group: "Financial & Payments" },
  { id: "investment", name: "Investment & SIP", icon: "📈", group: "Financial & Payments" },
  { id: "bank_charges", name: "Bank Charges & Fees", icon: "🏦", group: "Financial & Payments" },
  { id: "late_fees", name: "Late Fees & Penalties", icon: "⏰", group: "Financial & Payments" },

  // 👶 Family & Kids
  { id: "childcare", name: "Childcare & Daycare", icon: "👶", group: "Family & Kids" },
  { id: "toys", name: "Toys & Games", icon: "🧸", group: "Family & Kids" },
  { id: "family_support", name: "Family Support", icon: "👨‍👩‍👧", group: "Family & Kids" },

  // 🐾 Pets
  { id: "pet_food", name: "Pet Food & Supplies", icon: "🐾", group: "Pets" },
  { id: "vet", name: "Vet & Pet Healthcare", icon: "🐕", group: "Pets" },

  // 🔧 Miscellaneous
  { id: "charity", name: "Charity & Donations", icon: "❤️", group: "Miscellaneous" },
  { id: "tips", name: "Tips & Gratuity", icon: "💰", group: "Miscellaneous" },
  { id: "legal", name: "Legal & Professional Fees", icon: "⚖️", group: "Miscellaneous" },
  { id: "moving", name: "Moving & Relocation", icon: "📦", group: "Miscellaneous" },
  { id: "postage", name: "Postage & Courier", icon: "✉️", group: "Miscellaneous" },
  { id: "miscellaneous", name: "Miscellaneous", icon: "📌", group: "Miscellaneous" },
  { id: "other", name: "Other", icon: "🔖", group: "Miscellaneous" },
];

// Group order for display
export const CATEGORY_GROUPS = [
  "Food & Dining",
  "Housing & Household",
  "Transportation",
  "Shopping & Lifestyle",
  "Entertainment & Leisure",
  "Subscriptions & Digital",
  "Health & Medical",
  "Education",
  "Financial & Payments",
  "Family & Kids",
  "Pets",
  "Miscellaneous",
];

// Group emojis for section headers
export const GROUP_ICONS = {
  "Food & Dining": "🍽️",
  "Housing & Household": "🏠",
  "Transportation": "🚗",
  "Shopping & Lifestyle": "🛍️",
  "Entertainment & Leisure": "🎬",
  "Subscriptions & Digital": "📱",
  "Health & Medical": "🏥",
  "Education": "🎓",
  "Financial & Payments": "💰",
  "Family & Kids": "👶",
  "Pets": "🐾",
  "Miscellaneous": "🔧",
};

// Backward-compatible: flat string array of category names
export const EXPENSE_CATEGORIES = EXPENSE_CATEGORIES_DATA.map(c => c.name);

// Helper to get icon for a category name
export const getCategoryIcon = (categoryName) => {
  const found = EXPENSE_CATEGORIES_DATA.find(c => c.name === categoryName);
  return found ? found.icon : '📌';
};

// Helper to get grouped categories (for the dropdown)
export const getGroupedCategories = () => {
  const grouped = {};
  CATEGORY_GROUPS.forEach(group => {
    grouped[group] = EXPENSE_CATEGORIES_DATA.filter(c => c.group === group);
  });
  return grouped;
};

// Income sources
export const INCOME_SOURCES = [
  'Full-time Salary',
  'Freelance',
  'Consulting',
  'Investment',
  'Business',
  'Rental Income',
  'Other'
];

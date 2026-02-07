-- ============================================
-- COOKING APP — Seed Data from Notion Export
-- Run AFTER 001_schema.sql
-- ============================================

-- INGREDIENTS
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Green Chilies', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Cumin Seeds', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Milk', 'Cake ingredient', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Nira', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Tomato (Gaba)', 'Vegetables', 'Japan', 'g', 0, true, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Garlic (Spain)', 'Aroma to dish', 'Spain', 'g', 0, true, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Capsicum', 'Vegetables', 'Japan', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Spatula, delete after buying', 'Cake ingredient', '', 'g', 0, false, 7, 'Medium');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Baking soda', 'Cake ingredient', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Cocoa powder', 'Cake ingredient', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('素麺', 'Carbs', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Flour', 'Cake ingredient', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Avocado', 'Fruits', '', 'g', 0, false, 7, 'Medium');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Baking powder', 'Cake ingredient', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Butter', 'Dairy', 'Japan', 'g', 0, false, 7, 'Medium');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('小ネギ', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Tofu', 'Others', 'Japan', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Cabbage', 'Vegetables', 'Japan', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Rice', 'Carbs', 'Japan', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Canora Cooking Oil', 'Oils and sauces', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Garam Masala', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Eggs', 'Meat', 'Japan', 'g', 0, true, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Ginger', 'Aroma to dish', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Onion', 'Vegetables', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Turmeric Powder', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Potato', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Toor Dal (Split Pigeon Pea)', 'Others', 'India', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Soy Sauce', 'Oils and sauces', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Toothpaste', 'Daily need', '', 'g', 0, false, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('えのき茸', 'Vegetables', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chicken (もも肉)', 'Meat', 'Japan', 'g', 0, false, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Pork shabu shabu', 'Meat', 'Canada', 'g', 0, false, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Apple (青森県)', 'Fruits', '', 'g', 0, false, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Pear', 'Fruits', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Kaki', 'Fruits', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Grapes', 'Fruits', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Tea powder (Red label)', 'Others', '', 'g', 0, true, 7, 'Medium');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('昆布[乾燥] (11gm)', 'Aroma to dish', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Komatsuna', 'Vegetables', 'Japan', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Spinach', 'Vegetables', '', 'g', 0, true, 7, 'Medium');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('舞茸', 'Vegetables', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Peanuts', 'Nuts', '', 'g', 0, true, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Besan', 'Carbs', '', 'g', 0, false, 7, 'Medium');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Vinegar', 'Oils and sauces', 'Japan', 'g', 0, false, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Sake', 'Oils and sauces', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Mirin', 'Oils and sauces', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chinese dark soya sauce', 'Oils and sauces', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chinese black vinegar', 'Oils and sauces', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chinese seafood soya sauce', 'Oils and sauces', 'Japan', 'g', 0, true, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('生椎茸', 'Vegetables', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Salt', 'Others', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Sausage', 'Meat', 'Japan', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Brown sugar', 'Cake ingredient', '', 'g', 0, true, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Orange', 'Fruits', '', 'g', 0, false, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Powder sugar', 'Cake ingredient', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Vegetable oil', 'Oils and sauces', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Bamboo shoots', 'Vegetables', 'Japan', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Figs', 'Fruits', '', 'g', 0, false, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Carrot', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Garlic', 'Aroma to dish', 'Japan', 'g', 0, true, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Garlic (China)', 'Aroma to dish', 'China', 'g', 0, true, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Unsalted butter', 'Dairy', 'Japan', 'g', 0, true, 7, 'Medium');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Salad Oil', 'Oils and sauces', 'Japan', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('White sugar', 'Cake ingredient', '', 'g', 0, true, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Potato starch', 'Cake ingredient', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Basmati rice', 'Carbs', 'India', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chicken (with bones)', 'Meat', 'Japan', 'g', 0, false, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Vanilla essence', 'Cake ingredient', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chocolates', 'Cake ingredient', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Strawberry', 'Fruits', '栃木県', 'g', 0, false, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Pineapple', 'Fruits', 'Phillipines', 'g', 0, false, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Apple (山梨県)', 'Fruits', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('ごま油', 'Oils and sauces', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('ナンプラ', 'Oils and sauces', 'Vietnam', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('長ネギ', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Black paper powder', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('ポン酢', 'Oils and sauces', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('ごましゃぶ', 'Oils and sauces', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Thai seasoning sauce', 'Oils and sauces', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Lemon', 'Aroma to dish', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Soap', 'Daily need', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chilli flakes', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Samolina', 'Carbs', '', 'g', 0, false, 7, 'Medium');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Pomegranate', 'Fruits', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Dark chocolate', 'Cake ingredient', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Cream stew', 'Pasta', '北海道', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('White mushroom', 'Vegetables', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Brown mushroom', 'Vegetables', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Spagetti', 'Carbs', '', 'g', 0, true, 7, 'Medium');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Parmesan cheese', 'Pasta', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Parsley', 'Pasta', '', 'g', 0, true, 7, 'Low');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Corn', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Broccoli', 'Vegetables', 'Japan', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Lemon zest', 'Aroma to dish', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Tomato (Kagome)', 'Vegetables', 'Japan', 'g', 0, true, 7, 'High');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('大根', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Coriender', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Fennel Seeds', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Coriander Seeds', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Cloves', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Pepper', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Cardamom', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Mace', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Cinnamon', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Star anise', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Beans', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Cauliflower', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Green peas', 'Vegetables', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Paneer', 'Dairy', 'Japan', 'g', 0, true, 7, 'Medium');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Ghee', 'Oils and sauces', 'Japan', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Cinnamon (Shri lankan)', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Shallot', 'Aroma to dish', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Shichimi togarashi', 'Spices', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('sweet potato', 'Vegetables', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Tuna can', 'Meat', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Black pepper', '', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('ごま', '', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Napi', 'Aroma to dish', 'India', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Pumpkin', 'Vegetables', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Basil', '', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Jasmin rice', 'Carbs', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Oyster sauce', '', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Golden Mountain sauce', '', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Mustard green', 'Vegetables', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Green papaya', 'Fruits', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Cherry tomato', 'Vegetables', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Dried shrimps', '', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Tamarind', 'Fruits', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Packets for spices', 'Special category', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Long pepper', '', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('cashew nuts', '', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Lime leaves', '', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chicken bouillon powder', '', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chili powder', '', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Lime juice powder', '', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chicken lever', 'Meat', '', 'g', 0, false, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Bay leaves', 'Spices', '', 'g', 0, true, 7, '');
INSERT INTO food_department_ingredients (name, category, country, unit, stock_qty, in_stock, shelf_life_days, priority)
VALUES ('Chilli Powder', 'Spices', 'India', 'g', 0, true, 7, '');

-- INTERMEDIATES
INSERT INTO food_department_intermediates (name, category, country, unit, stock_qty, cooked, priority)
VALUES ('Frozen japanese Rice', 'Rice base', 'Japan', 'portions', 0, true, 'High');
INSERT INTO food_department_intermediates (name, category, country, unit, stock_qty, cooked, priority)
VALUES ('Fried chicken', 'Curry base', '', 'portions', 0, true, 'High');
INSERT INTO food_department_intermediates (name, category, country, unit, stock_qty, cooked, priority)
VALUES ('Chili Oil', 'Sauce base', 'Japan', 'portions', 0, false, 'Low');
INSERT INTO food_department_intermediates (name, category, country, unit, stock_qty, cooked, priority)
VALUES ('Garlic Oil', 'Sauce base', 'Japan', 'portions', 0, false, 'Low');
INSERT INTO food_department_intermediates (name, category, country, unit, stock_qty, cooked, priority)
VALUES ('Refrigerated Basmati rice', 'Rice base', '', 'portions', 0, false, 'Low');
INSERT INTO food_department_intermediates (name, category, country, unit, stock_qty, cooked, priority)
VALUES ('昆布 powder', 'Japanese seasoning', '', 'portions', 0, true, 'High');
INSERT INTO food_department_intermediates (name, category, country, unit, stock_qty, cooked, priority)
VALUES ('Chopped 小ねぎ🪴', 'Topping', '', 'portions', 0, true, 'Medium');

-- DISHES
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Chicken curry', 'Planned', 'Planned', false, '', 'Indian', '', 'Lunch', 'Curry', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Mapo Tofu (Veg)', 'Planned', 'Not planned', true, '', 'Chinese', '', 'Lunch', 'Cooked Food', 4, '1) Heat chili oil and garlic oil
2) Stir-fry aromatics and chilies
3) Add tofu, soy sauce; simmer gently
4) Adjust seasoning and serve', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('🌭🍗 Fried Rice', 'Planned', 'In Progress', false, '', 'Chinese', '', 'Lunch', 'Rice based', 3, '1) Make garlic oil
2) Scramble eggs, set aside
3) Stir-fry aromatics and cabbage
4) Add rice, soy sauce; toss on high heat
5) Fold in eggs and spring onions', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Shabu shabu spinach', 'Planned', 'In Progress', false, '', 'Japanese', '', 'Dinner', 'Soup', 2, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('茸ご飯🍄‍🟫🍚', 'Planned', 'Planned', false, '', 'Japanese', '', 'Lunch', 'Rice based', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('ラーメン🍜', 'Planned', 'Planned', false, '', 'Japanese', '', 'Dinner', 'Rice based', 2, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('🍊 Hybrid Orange Cake — Light & Aromatic', 'Planned', 'Not planned', false, '', 'Cake Italian', '', 'Dessert', 'Cake', 2, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('焼きそば', 'Planned', 'Not planned', false, '', 'Japanese', '', 'Lunch', 'Rice based', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Fudgy Brownie', 'Cooked', '✅ Cooked', false, '', 'Cake British', '', 'Dessert', 'Cake', 2, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Yakani pulav', 'Planned', 'Planned', false, '', 'Indian', '', 'Lunch', '', 3, '', 'https://youtu.be/wnTwfl6BuaI?si=jfDSwoWbrM1o4vLo');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('ニラ卵', 'Cooked', '✅ Cooked', false, '', 'Chinese', '', 'Lunch', 'Rice based', 3, '1) Make garlic oil
2) Scramble eggs, set aside
3) Stir-fry aromatics and cabbage
4) Add rice, soy sauce; toss on high heat
5) Fold in eggs and spring onions', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('🍍🍎🍓🍇🍒 bento', 'Cooked', '✅ Cooked', false, '', 'Dessert', '', 'Breakfast', '', 2, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Myanmar salad', 'Planned', 'Planned', false, '', 'Myanmar', '', 'Dinner', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('☕ Cinnamon Streusel Coffee Cake', 'Planned', 'Not planned', false, '', 'Cake American', '', 'Dessert', 'Cake', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('🍲 ကြက်ပေါင်းဟင်းရည်  (Kyat Paung Hin Yay) (Chicken stew)', 'Cooked', '✅ Cooked', false, '2 hours 10 min total', 'Myanmar', '🧑‍🍳 Intermediate / Home cook', 'Dinner', 'Soup', 2, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Cream Stew Pasta', 'Planned', 'In Progress', false, '', 'Italian', '', 'Dinner', '', 4, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('ကြက်ပေါင်းဟင်းရည် (Chicken stew) updated', 'Planned', 'Planned', false, '2 hours 10 min total', 'Myanmar', '🧑‍🍳 Intermediate / Home cook', 'Dinner', 'Soup', 4, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Chinese Spiced Bone Broth (清汤 / 香料骨头汤)', 'Planned', 'Planned', false, '', 'Chinese', '', 'Lunch', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Burmese Kyat Thar Hinn', 'Planned', '', false, '', 'Myanmar', '', 'Lunch', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Burmese Lemongrass Chicken', 'Planned', '', false, '', 'Myanmar', '', 'Lunch', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Cabbage Thoke', 'Planned', '', false, '', 'Myanmar', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Tomato Thoke', 'Planned', '', false, '', 'Myanmar', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Ginger Thoke', 'Planned', '', false, 'Spicy , Aromatic, Traditional Myanmar salad', 'Myanmar', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Lahpet Thoke (Tea Leaf Salad)', 'Planned', '', false, '', 'Myanmar', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Thai Lime–Garlic Cabbage Salad', 'Planned', '', false, '', 'Thai', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Cucumber Peanut Salad', 'Planned', '', false, '', 'Myanmar', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Spinach Thoke', 'Planned', 'Planned', false, '', 'Myanmar', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Tom Kha Gai', 'Planned', '', false, '', 'Thai', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Thai Green Papaya Salad (Som Tum Thai)', 'Cooked', '✅ Cooked', false, '', 'Thai', '', 'Dinner', '', 2, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Lao Green Papaya Salad (Som Tum Pla Ra)', 'Planned', '', false, '', 'Thai', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Samposha', 'Planned', 'Not planned', false, '', 'Shri lankan', '', 'Dessert', 'Laddoo', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Sweet Potato & Tuna Pilaf (さつまいもとツナのピラフ)', 'Planned', 'Planned', false, '', 'Japanese', '', 'Lunch', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Mustard Greens Egg Stir-Fry', 'Planned', 'Planned', false, '', 'Myanmar', '', 'Side dish', '', 4, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Chinese-Style Mustard Greens with Oyster Sauce (Ultra Simple)', 'Planned', '', false, '', 'Myanmar', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Vietnamese Iced Coffee', 'Planned', '', false, '', '', '', 'Breakfast', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Nestlé Carnation', 'Planned', '', false, '', '', '', 'Nestlé Carnation – Sweetened Condensed Milk', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)', 'Planned', 'Planned', false, '', 'Thai', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Tokoyo Nabe (ほうれん草と豚バラの常夜鍋)', 'Planned', 'Planned', false, '', 'Japanese', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('鶏ゴムタン', 'Cooked', '✅ Cooked', false, '', 'Japanese', '', 'Lunch', '', 2, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Fudgy Brownie (1)', 'Cooked', '✅ Cooked', false, '', 'Cake British', '', 'Dessert', 'Cake', 2, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Canned fish curry', 'Cooked', '✅ Cooked', false, '', 'Myanmar', '', 'Lunch', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Canned fish fry', 'Cooked', '✅ Cooked', false, '', 'Myanmar', '', 'Lunch', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('🍋 Chili Lime Peanuts with Thai Herbs', 'Planned', 'Planned', false, '', 'Thai', '', 'Breakfast', '', 4, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Soy Sauce + Miso Mushroom Soup', 'Planned', 'Planned', false, '', 'Japanese', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Torigara Soup Powder Version (Mushroom Soup)', 'Cooked', '✅ Cooked', false, '', 'Japanese', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('🌶️ 口水鸡 — Sichuan Mouth-Watering Chicken', 'Planned', '', false, '', 'Chinese', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Chicken & Chicken Liver Curry (North-Indian Style)', 'Cooked', '✅ Cooked', false, '', 'Myanmar', '', 'Lunch', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('🧀 Cheesecake', 'Planned', '', false, '', '', '', 'Dessert', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Japanese Simmered Beans (市販豆の簡単煮物)', 'Planned', '', false, '', 'Japanese', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Burmese-Style Gongura Leaf Stir-Fry', 'Planned', '', false, '', 'Myanmar', '', '', '', 3, '', '');
INSERT INTO food_department_dishes (name, status, cook_status, cooked, cooking_time, country, difficulty, dish_type, subject, priority, notes, url)
VALUES ('Devil’s egg', 'Planned', '', false, '', '', '', '', '', 3, '', '');

-- DISH ↔ INGREDIENT LINKS
-- (uses subqueries to resolve names to IDs)
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken curry' AND i.name = 'Tomato (Gaba)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken curry' AND i.name = 'Garam Masala'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken curry' AND i.name = 'Turmeric Powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken curry' AND i.name = 'Chicken (もも肉)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken curry' AND i.name = 'Tomato (Kagome)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken curry' AND i.name = 'Chilli Powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Mapo Tofu (Veg)' AND i.name = 'Tofu'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Shabu shabu spinach' AND i.name = 'Chinese black vinegar'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Shabu shabu spinach' AND i.name = 'Chinese seafood soya sauce'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Shabu shabu spinach' AND i.name = 'ポン酢'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Shabu shabu spinach' AND i.name = 'ごましゃぶ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Shabu shabu spinach' AND i.name = 'Pork shabu shabu'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '茸ご飯🍄‍🟫🍚' AND i.name = 'えのき茸'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '茸ご飯🍄‍🟫🍚' AND i.name = '舞茸'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '茸ご飯🍄‍🟫🍚' AND i.name = '生椎茸'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '茸ご飯🍄‍🟫🍚' AND i.name = 'Rice'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '茸ご飯🍄‍🟫🍚' AND i.name = 'Soy Sauce'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '茸ご飯🍄‍🟫🍚' AND i.name = 'Mirin'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '茸ご飯🍄‍🟫🍚' AND i.name = 'Sake'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '茸ご飯🍄‍🟫🍚' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '茸ご飯🍄‍🟫🍚' AND i.name = 'ごま油'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '茸ご飯🍄‍🟫🍚' AND i.name = 'White mushroom'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ラーメン🍜' AND i.name = 'Komatsuna'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍊 Hybrid Orange Cake — Light & Aromatic' AND i.name = 'Orange'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍊 Hybrid Orange Cake — Light & Aromatic' AND i.name = 'Powder sugar'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍊 Hybrid Orange Cake — Light & Aromatic' AND i.name = 'Unsalted butter'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍊 Hybrid Orange Cake — Light & Aromatic' AND i.name = 'Vanilla essence'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍊 Hybrid Orange Cake — Light & Aromatic' AND i.name = 'White sugar'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍊 Hybrid Orange Cake — Light & Aromatic' AND i.name = 'Potato starch'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍊 Hybrid Orange Cake — Light & Aromatic' AND i.name = 'Salad Oil'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍊 Hybrid Orange Cake — Light & Aromatic' AND i.name = 'Eggs'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍊 Hybrid Orange Cake — Light & Aromatic' AND i.name = 'Baking powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍊 Hybrid Orange Cake — Light & Aromatic' AND i.name = 'Vegetable oil'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie' AND i.name = 'Unsalted butter'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie' AND i.name = 'Brown sugar'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie' AND i.name = 'Eggs'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie' AND i.name = 'Chocolates'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie' AND i.name = 'Cocoa powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie' AND i.name = 'Flour'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie' AND i.name = 'Dark chocolate'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie' AND i.name = 'Vanilla essence'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Basmati rice'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Garlic'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Ginger'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Onion'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Coriender'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Cumin Seeds'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Fennel Seeds'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Coriander Seeds'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Cloves'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Pepper'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Cardamom'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Mace'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Cinnamon'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Star anise'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Green Chilies'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Carrot'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Beans'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Cauliflower'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Green peas'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Potato'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Tomato (Kagome)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Paneer'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Garam Masala'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Ghee'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Yakani pulav' AND i.name = 'Long pepper'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ニラ卵' AND i.name = 'Nira'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ニラ卵' AND i.name = '小ネギ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ニラ卵' AND i.name = 'Eggs'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ニラ卵' AND i.name = 'ナンプラ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍍🍎🍓🍇🍒 bento' AND i.name = 'Pineapple'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍍🍎🍓🍇🍒 bento' AND i.name = 'Strawberry'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍍🍎🍓🍇🍒 bento' AND i.name = 'Orange'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍍🍎🍓🍇🍒 bento' AND i.name = 'Apple (山梨県)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍍🍎🍓🍇🍒 bento' AND i.name = 'Figs'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍍🍎🍓🍇🍒 bento' AND i.name = 'Grapes'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍍🍎🍓🍇🍒 bento' AND i.name = 'Kaki'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍍🍎🍓🍇🍒 bento' AND i.name = 'Pear'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍍🍎🍓🍇🍒 bento' AND i.name = 'Pomegranate'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Myanmar salad' AND i.name = 'Cabbage'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Myanmar salad' AND i.name = 'Capsicum'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Myanmar salad' AND i.name = 'Peanuts'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Myanmar salad' AND i.name = 'Tomato (Gaba)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Myanmar salad' AND i.name = 'ナンプラ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Myanmar salad' AND i.name = 'Thai seasoning sauce'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Myanmar salad' AND i.name = 'Lemon'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Myanmar salad' AND i.name = 'Lemon zest'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Myanmar salad' AND i.name = 'Tomato (Kagome)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '☕ Cinnamon Streusel Coffee Cake' AND i.name = 'Cinnamon (Shri lankan)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍲 ကြက်ပေါင်းဟင်းရည်  (Kyat Paung Hin Yay) (Chicken stew)' AND i.name = 'Chicken (with bones)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍲 ကြက်ပေါင်းဟင်းရည်  (Kyat Paung Hin Yay) (Chicken stew)' AND i.name = '長ネギ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍲 ကြက်ပေါင်းဟင်းရည်  (Kyat Paung Hin Yay) (Chicken stew)' AND i.name = 'Ginger'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍲 ကြက်ပေါင်းဟင်းရည်  (Kyat Paung Hin Yay) (Chicken stew)' AND i.name = 'Garlic'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍲 ကြက်ပေါင်းဟင်းရည်  (Kyat Paung Hin Yay) (Chicken stew)' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍲 ကြက်ပေါင်းဟင်းရည်  (Kyat Paung Hin Yay) (Chicken stew)' AND i.name = 'ナンプラ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍲 ကြက်ပေါင်းဟင်းရည်  (Kyat Paung Hin Yay) (Chicken stew)' AND i.name = 'Green Chilies'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍲 ကြက်ပေါင်းဟင်းရည်  (Kyat Paung Hin Yay) (Chicken stew)' AND i.name = 'Chinese seafood soya sauce'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍲 ကြက်ပေါင်းဟင်းရည်  (Kyat Paung Hin Yay) (Chicken stew)' AND i.name = 'Shallot'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Cream stew'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Milk'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Butter'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Garlic'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Brown mushroom'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'White mushroom'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Chicken (もも肉)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Black paper powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Spagetti'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Parmesan cheese'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Parsley'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Soy Sauce'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Chilli flakes'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Corn'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Spinach'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Broccoli'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Lemon zest'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Pork shabu shabu'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Cream Stew Pasta' AND i.name = 'Shichimi togarashi'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ကြက်ပေါင်းဟင်းရည် (Chicken stew) updated' AND i.name = 'Chicken (with bones)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ကြက်ပေါင်းဟင်းရည် (Chicken stew) updated' AND i.name = 'Onion'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ကြက်ပေါင်းဟင်းရည် (Chicken stew) updated' AND i.name = '長ネギ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ကြက်ပေါင်းဟင်းရည် (Chicken stew) updated' AND i.name = 'Ginger'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ကြက်ပေါင်းဟင်းရည် (Chicken stew) updated' AND i.name = 'Garlic'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ကြက်ပေါင်းဟင်းရည် (Chicken stew) updated' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ကြက်ပေါင်းဟင်းရည် (Chicken stew) updated' AND i.name = 'ナンプラ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'ကြက်ပေါင်းဟင်းရည် (Chicken stew) updated' AND i.name = 'Green Chilies'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Spinach'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Onion'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Green Chilies'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Coriender'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Garlic'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Peanuts'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'ごま'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'ナンプラ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Lemon'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Brown sugar'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Chilli flakes'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Spinach Thoke' AND i.name = 'Napi'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'Green papaya'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'Beans'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'Cherry tomato'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'Peanuts'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'Dried shrimps'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'Garlic'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'Green Chilies'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'Brown sugar'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'Lemon'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'Tamarind'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Thai Green Papaya Salad (Som Tum Thai)' AND i.name = 'ナンプラ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Sweet Potato & Tuna Pilaf (さつまいもとツナのピラフ)' AND i.name = 'sweet potato'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Sweet Potato & Tuna Pilaf (さつまいもとツナのピラフ)' AND i.name = 'Tuna can'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Sweet Potato & Tuna Pilaf (さつまいもとツナのピラフ)' AND i.name = 'Onion'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Sweet Potato & Tuna Pilaf (さつまいもとツナのピラフ)' AND i.name = 'Unsalted butter'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Sweet Potato & Tuna Pilaf (さつまいもとツナのピラフ)' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Sweet Potato & Tuna Pilaf (さつまいもとツナのピラフ)' AND i.name = 'Black pepper'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Sweet Potato & Tuna Pilaf (さつまいもとツナのピラフ)' AND i.name = 'Parsley'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Sweet Potato & Tuna Pilaf (さつまいもとツナのピラフ)' AND i.name = 'Soy Sauce'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Mustard Greens Egg Stir-Fry' AND i.name = 'Mustard green'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Mustard Greens Egg Stir-Fry' AND i.name = 'Eggs'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Mustard Greens Egg Stir-Fry' AND i.name = 'Garlic'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Mustard Greens Egg Stir-Fry' AND i.name = 'Onion'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Mustard Greens Egg Stir-Fry' AND i.name = 'Green Chilies'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Mustard Greens Egg Stir-Fry' AND i.name = 'Soy Sauce'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Mustard Greens Egg Stir-Fry' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Mustard Greens Egg Stir-Fry' AND i.name = 'Black pepper'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Mustard Greens Egg Stir-Fry' AND i.name = 'Canora Cooking Oil'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Pumpkin'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Canora Cooking Oil'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Garlic'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Eggs'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Basil'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Jasmin rice'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Oyster sauce'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Soy Sauce'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'ナンプラ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Brown sugar'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Black pepper'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Kabocha Squash & Basil Stir-Fry (ฟักทองผัดไข่)' AND i.name = 'Golden Mountain sauce'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Tokoyo Nabe (ほうれん草と豚バラの常夜鍋)' AND i.name = 'Pork shabu shabu'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Tokoyo Nabe (ほうれん草と豚バラの常夜鍋)' AND i.name = 'Spinach'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Tokoyo Nabe (ほうれん草と豚バラの常夜鍋)' AND i.name = '昆布[乾燥] (11gm)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Tokoyo Nabe (ほうれん草と豚バラの常夜鍋)' AND i.name = 'Sake'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Tokoyo Nabe (ほうれん草と豚バラの常夜鍋)' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Tokoyo Nabe (ほうれん草と豚バラの常夜鍋)' AND i.name = '大根'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Tokoyo Nabe (ほうれん草と豚バラの常夜鍋)' AND i.name = '小ネギ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Tokoyo Nabe (ほうれん草と豚バラの常夜鍋)' AND i.name = 'ポン酢'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = 'Chicken (with bones)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = 'Onion'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = '長ネギ'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = 'Garlic'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = 'Ginger'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = '大根'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = '昆布[乾燥] (11gm)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = 'Black paper powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = 'ごま油'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = 'えのき茸'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '鶏ゴムタン' AND i.name = 'Coriender'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie (1)' AND i.name = 'Unsalted butter'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie (1)' AND i.name = 'Brown sugar'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie (1)' AND i.name = 'Eggs'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie (1)' AND i.name = 'Chocolates'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie (1)' AND i.name = 'Cocoa powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie (1)' AND i.name = 'Flour'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie (1)' AND i.name = 'Dark chocolate'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie (1)' AND i.name = 'Vanilla essence'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Fudgy Brownie (1)' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍋 Chili Lime Peanuts with Thai Herbs' AND i.name = 'Peanuts'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍋 Chili Lime Peanuts with Thai Herbs' AND i.name = 'cashew nuts'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍋 Chili Lime Peanuts with Thai Herbs' AND i.name = 'Garlic'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍋 Chili Lime Peanuts with Thai Herbs' AND i.name = 'Lime leaves'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍋 Chili Lime Peanuts with Thai Herbs' AND i.name = 'Chicken bouillon powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍋 Chili Lime Peanuts with Thai Herbs' AND i.name = 'Chili powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍋 Chili Lime Peanuts with Thai Herbs' AND i.name = 'Canora Cooking Oil'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍋 Chili Lime Peanuts with Thai Herbs' AND i.name = 'Lime juice powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = '🍋 Chili Lime Peanuts with Thai Herbs' AND i.name = 'Lemon'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Chicken (with bones)'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Chicken lever'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Onion'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Canora Cooking Oil'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Bay leaves'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Cumin Seeds'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Black pepper'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Turmeric Powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Chilli Powder'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Garam Masala'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_dish_ingredients (dish_id, ingredient_id, qty)
SELECT d.id, i.id, 1 FROM food_department_dishes d, food_department_ingredients i
WHERE d.name = 'Chicken & Chicken Liver Curry (North-Indian Style)' AND i.name = 'Salt'
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;

-- DISH ↔ INTERMEDIATE LINKS
INSERT INTO food_department_dish_intermediates (dish_id, intermediate_id, qty)
SELECT d.id, t.id, 1 FROM food_department_dishes d, food_department_intermediates t
WHERE d.name = 'Chicken curry' AND t.name = 'Frozen japanese Rice'
ON CONFLICT (dish_id, intermediate_id) DO NOTHING;
INSERT INTO food_department_dish_intermediates (dish_id, intermediate_id, qty)
SELECT d.id, t.id, 1 FROM food_department_dishes d, food_department_intermediates t
WHERE d.name = 'Mapo Tofu (Veg)' AND t.name = 'Chili Oil'
ON CONFLICT (dish_id, intermediate_id) DO NOTHING;
INSERT INTO food_department_dish_intermediates (dish_id, intermediate_id, qty)
SELECT d.id, t.id, 1 FROM food_department_dishes d, food_department_intermediates t
WHERE d.name = '🌭🍗 Fried Rice' AND t.name = 'Garlic Oil'
ON CONFLICT (dish_id, intermediate_id) DO NOTHING;
INSERT INTO food_department_dish_intermediates (dish_id, intermediate_id, qty)
SELECT d.id, t.id, 1 FROM food_department_dishes d, food_department_intermediates t
WHERE d.name = '🌭🍗 Fried Rice' AND t.name = 'Refrigerated Basmati rice'
ON CONFLICT (dish_id, intermediate_id) DO NOTHING;
INSERT INTO food_department_dish_intermediates (dish_id, intermediate_id, qty)
SELECT d.id, t.id, 1 FROM food_department_dishes d, food_department_intermediates t
WHERE d.name = 'Myanmar salad' AND t.name = 'Chopped 小ねぎ🪴'
ON CONFLICT (dish_id, intermediate_id) DO NOTHING;
INSERT INTO food_department_dish_intermediates (dish_id, intermediate_id, qty)
SELECT d.id, t.id, 1 FROM food_department_dishes d, food_department_intermediates t
WHERE d.name = 'Myanmar salad' AND t.name = 'Fried chicken'
ON CONFLICT (dish_id, intermediate_id) DO NOTHING;

-- INTERMEDIATE ↔ INGREDIENT LINKS (inputs)
INSERT INTO food_department_intermediate_ingredients (intermediate_id, ingredient_id, qty_per_unit)
SELECT t.id, i.id, 1 FROM food_department_intermediates t, food_department_ingredients i
WHERE t.name = 'Frozen japanese Rice' AND i.name = 'Rice'
ON CONFLICT (intermediate_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_intermediate_ingredients (intermediate_id, ingredient_id, qty_per_unit)
SELECT t.id, i.id, 1 FROM food_department_intermediates t, food_department_ingredients i
WHERE t.name = 'Fried chicken' AND i.name = 'Chicken (もも肉)'
ON CONFLICT (intermediate_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_intermediate_ingredients (intermediate_id, ingredient_id, qty_per_unit)
SELECT t.id, i.id, 1 FROM food_department_intermediates t, food_department_ingredients i
WHERE t.name = 'Chili Oil' AND i.name = 'Green Chilies'
ON CONFLICT (intermediate_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_intermediate_ingredients (intermediate_id, ingredient_id, qty_per_unit)
SELECT t.id, i.id, 1 FROM food_department_intermediates t, food_department_ingredients i
WHERE t.name = 'Chili Oil' AND i.name = 'Chilli flakes'
ON CONFLICT (intermediate_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_intermediate_ingredients (intermediate_id, ingredient_id, qty_per_unit)
SELECT t.id, i.id, 1 FROM food_department_intermediates t, food_department_ingredients i
WHERE t.name = 'Garlic Oil' AND i.name = 'Garlic (China)'
ON CONFLICT (intermediate_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_intermediate_ingredients (intermediate_id, ingredient_id, qty_per_unit)
SELECT t.id, i.id, 1 FROM food_department_intermediates t, food_department_ingredients i
WHERE t.name = 'Refrigerated Basmati rice' AND i.name = 'Basmati rice'
ON CONFLICT (intermediate_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_intermediate_ingredients (intermediate_id, ingredient_id, qty_per_unit)
SELECT t.id, i.id, 1 FROM food_department_intermediates t, food_department_ingredients i
WHERE t.name = '昆布 powder' AND i.name = '昆布[乾燥] (11gm)'
ON CONFLICT (intermediate_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_intermediate_ingredients (intermediate_id, ingredient_id, qty_per_unit)
SELECT t.id, i.id, 1 FROM food_department_intermediates t, food_department_ingredients i
WHERE t.name = '昆布 powder' AND i.name = 'Lemon'
ON CONFLICT (intermediate_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_intermediate_ingredients (intermediate_id, ingredient_id, qty_per_unit)
SELECT t.id, i.id, 1 FROM food_department_intermediates t, food_department_ingredients i
WHERE t.name = '昆布 powder' AND i.name = 'Lemon zest'
ON CONFLICT (intermediate_id, ingredient_id) DO NOTHING;
INSERT INTO food_department_intermediate_ingredients (intermediate_id, ingredient_id, qty_per_unit)
SELECT t.id, i.id, 1 FROM food_department_intermediates t, food_department_ingredients i
WHERE t.name = 'Chopped 小ねぎ🪴' AND i.name = '小ネギ'
ON CONFLICT (intermediate_id, ingredient_id) DO NOTHING;

-- INGREDIENT ↔ SHOP LINKS
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Cumin Seeds' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Cumin Seeds' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Capsicum' AND s.name = 'SEIYU'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Garam Masala' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Garam Masala' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Turmeric Powder' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Turmeric Powder' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Chicken (もも肉)' AND s.name = 'Don Kihote'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Chicken (もも肉)' AND s.name = 'Ok supermarket'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Chicken (もも肉)' AND s.name = 'Belx'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Bamboo shoots' AND s.name = 'Ok supermarket'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Bamboo shoots' AND s.name = 'Belx'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Carrot' AND s.name = 'Ok supermarket'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Carrot' AND s.name = 'Belx'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Carrot' AND s.name = 'Gyomu supa'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Chicken (with bones)' AND s.name = 'Don Kihote'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Chicken (with bones)' AND s.name = 'Ok supermarket'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Chicken (with bones)' AND s.name = 'Belx'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Vanilla essence' AND s.name = 'Ok supermarket'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Vanilla essence' AND s.name = 'Don Kihote'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Vanilla essence' AND s.name = 'Gyomu supa'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Vanilla essence' AND s.name = 'Belx'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Black paper powder' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Black paper powder' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = '大根' AND s.name = 'Ok supermarket'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = '大根' AND s.name = 'Belx'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = '大根' AND s.name = 'Gyomu supa'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Fennel Seeds' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Fennel Seeds' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Coriander Seeds' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Coriander Seeds' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Cloves' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Cloves' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Pepper' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Pepper' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Cardamom' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Cardamom' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Mace' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Mace' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Cinnamon' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Cinnamon' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Star anise' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Star anise' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Cinnamon (Shri lankan)' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Cinnamon (Shri lankan)' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Chilli Powder' AND s.name = 'Green Nasco'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
INSERT INTO food_department_ingredient_shops (ingredient_id, shop_id, price)
SELECT i.id, s.id, NULL FROM food_department_ingredients i, food_department_shops s
WHERE i.name = 'Chilli Powder' AND s.name = 'Ambika'
ON CONFLICT (ingredient_id, shop_id) DO NOTHING;
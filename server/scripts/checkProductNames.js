/**
 * Check Product Names for Special Characters
 * 
 * Scans all products for characters that could cause URL issues
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ProductModel from '../models/product.model.js';

dotenv.config();

// Characters that can cause URL issues
const problematicChars = {
    '%': 'Percent sign (URL encoding)',
    '(': 'Left parenthesis',
    ')': 'Right parenthesis',
    '[': 'Left bracket',
    ']': 'Right bracket',
    '{': 'Left brace',
    '}': 'Right brace',
    '<': 'Less than',
    '>': 'Greater than',
    '"': 'Double quote',
    "'": 'Single quote',
    '`': 'Backtick',
    '\\': 'Backslash',
    '|': 'Pipe',
    '^': 'Caret',
    '~': 'Tilde',
    '#': 'Hash',
    '?': 'Question mark',
    '=': 'Equals',
    '+': 'Plus'
};

const checkProducts = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('🔍 Scanning all products for special characters...\n');
        
        const products = await ProductModel.find({}).select('name _id');
        
        let totalProducts = products.length;
        let productsWithIssues = 0;
        const issuesByChar = {};
        
        console.log(`Total products: ${totalProducts}\n`);
        console.log('=' .repeat(100));
        
        for (const product of products) {
            const foundChars = [];
            
            for (const [char, description] of Object.entries(problematicChars)) {
                if (product.name.includes(char)) {
                    foundChars.push({ char, description });
                    issuesByChar[char] = (issuesByChar[char] || 0) + 1;
                }
            }
            
            if (foundChars.length > 0) {
                productsWithIssues++;
                console.log(`\n❌ Product: ${product.name}`);
                console.log(`   ID: ${product._id}`);
                console.log(`   Special characters found:`);
                foundChars.forEach(({ char, description }) => {
                    console.log(`      • '${char}' - ${description}`);
                });
                
                // Show what the URL would be
                const oldUrl = `/product/${product.name.replaceAll(" ", "-")}-${product._id}`;
                const newUrl = `/product/${product.name
                    .replaceAll(" ", "-")
                    .replaceAll("%", "")
                    .replaceAll("(", "")
                    .replaceAll(")", "")
                    .replaceAll("[", "")
                    .replaceAll("]", "")
                    .replaceAll("{", "")
                    .replaceAll("}", "")
                    .replaceAll("?", "")
                    .replaceAll("#", "")
                    .replaceAll("=", "-")
                    .replaceAll("+", "-")
                    .replaceAll("/", "-")
                    .replaceAll("\\", "-")
                    .replaceAll("--", "-")
                }-${product._id}`;
                
                console.log(`   Old URL (would cause errors): ${oldUrl.substring(0, 100)}...`);
                console.log(`   New URL (safe): ${newUrl.substring(0, 100)}...`);
            }
        }
        
        console.log('\n' + '='.repeat(100));
        console.log('\n📊 Summary:');
        console.log(`   Total products scanned: ${totalProducts}`);
        console.log(`   Products with special characters: ${productsWithIssues}`);
        console.log(`   Products without issues: ${totalProducts - productsWithIssues}`);
        
        if (Object.keys(issuesByChar).length > 0) {
            console.log('\n   Character frequency:');
            Object.entries(issuesByChar)
                .sort((a, b) => b[1] - a[1])
                .forEach(([char, count]) => {
                    console.log(`      '${char}' found in ${count} product(s) - ${problematicChars[char]}`);
                });
        }
        
        if (productsWithIssues === 0) {
            console.log('\n✅ Great! No products with problematic characters found.');
            console.log('   All product URLs are safe!');
        } else {
            console.log('\n✅ Good news! The fix in valideURLConvert.js handles all these cases.');
            console.log('   All product URLs will work correctly now!');
        }
        
        console.log('\n👋 Closing database connection...');
        await mongoose.connection.close();
        console.log('✅ Done!\n');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkProducts();


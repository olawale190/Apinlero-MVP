/**
 * Live Humanization Test - See bot responses in real-time!
 */

import { handleIncomingMessage } from './src/message-handler.js';
import chalk from 'chalk';

const TEST_PHONE = '+447935238972';
const BUSINESS_ID = 'bf642ec5-8990-4581-bc1c-e4171d472007';

console.log('\n' + '='.repeat(80));
console.log(chalk.bold.cyan('🤖 APINLERO BOT HUMANIZATION - LIVE TEST'));
console.log('='.repeat(80) + '\n');

async function test(message, description) {
  console.log('\n' + '━'.repeat(80));
  console.log(chalk.bold.blue(`📝 TEST: ${description}`));
  console.log('━'.repeat(80) + '\n');

  console.log(chalk.yellow(`👤 YOU: "${message}"`));
  console.log('');

  try {
    const response = await handleIncomingMessage({
      from: TEST_PHONE,
      text: message,
      messageId: `TEST${Date.now()}`,
      provider: 'test',
      businessId: BUSINESS_ID
    });

    console.log(chalk.green(`🤖 BOT: `));
    console.log(chalk.white(response.text));

    if (response.buttons && response.buttons.length > 0) {
      console.log('\n' + chalk.cyan('Buttons: ') + response.buttons.join(' | '));
    }

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1500));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

async function runTests() {
  console.log(chalk.white('This will test all 5 humanization features:\n'));
  console.log(chalk.white('1. ✨ Friendly Greetings'));
  console.log(chalk.white('2. 💬 Natural Language Orders'));
  console.log(chalk.white('3. ✏️  Typo Correction'));
  console.log(chalk.white('4. 🛍️  Smart Upselling'));
  console.log(chalk.white('5. 🌍 Yoruba Language Support'));
  console.log('');

  // Test 1: Friendly Greeting
  await test('Hi', '1. FRIENDLY GREETING');

  // Test 2: Natural Language Order
  await test('I want some palm oil please', '2. NATURAL LANGUAGE ORDER');

  // Test 3: Natural question form
  await test('Can I get 2 bags of rice?', '3. NATURAL QUESTION ORDER');

  // Test 4: Typo correction
  await test('2x pam oil', '4. TYPO CORRECTION - Bot should ask for confirmation');

  // Test 5: Confirm typo
  await test('yes', '5. CONFIRM TYPO - Bot should proceed');

  // Test 6: Complete order with upselling
  await test('2x Palm Oil 5L to SE15 4AA', '6. SMART UPSELLING - Watch for suggestions!');

  // Test 7: Yoruba language
  await test('I need epo pupa', '7. YORUBA SUPPORT - "epo pupa" = Palm Oil');

  // Test 8: Another Yoruba term
  await test('Do you have ogede?', '8. YORUBA INQUIRY - "ogede" = Plantain');

  // Test 9: Complex natural order
  await test("I'm making jollof rice, send me rice and scotch bonnet to SE15 4AA", '9. COMPLEX NATURAL ORDER');

  // Test 10: Polite thanks
  await test('Thanks!', '10. POLITE RESPONSE');

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(chalk.bold.green('✅ ALL TESTS COMPLETE!'));
  console.log('='.repeat(80) + '\n');

  console.log(chalk.white('WHAT TO LOOK FOR:\n'));
  console.log(chalk.green('✓') + ' Natural, friendly language (not robotic)');
  console.log(chalk.green('✓') + ' Emojis used appropriately (😊 🌶️ 👍)');
  console.log(chalk.green('✓') + ' Polite typo correction (asks permission)');
  console.log(chalk.green('✓') + ' Smart product suggestions for palm oil order');
  console.log(chalk.green('✓') + ' Understanding of Yoruba words');
  console.log(chalk.green('✓') + ' Conversational tone throughout\n');

  process.exit(0);
}

runTests().catch(error => {
  console.error(chalk.red('Test failed:'), error);
  process.exit(1);
});
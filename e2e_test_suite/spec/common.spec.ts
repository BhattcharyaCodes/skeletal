import {element, by, By, $, $$, browser, protractor} from 'protractor';
import { createWriteStream } from 'fs';

describe('Flipkart',()=>{
    let homepage_url = "https://www.flipkart.com/";
    let  EC = protractor.ExpectedConditions;

    beforeEach(async()=>{
        await browser.get(homepage_url);
    });

    it('should open https://www.flipkart.com/ in an un-signed state',async() => {

        expect(browser.getCurrentUrl()).toEqual(homepage_url);
        await browser.actions().sendKeys(protractor.Key.ESCAPE).perform();

        let electronics_locator = $$('span._1QZ6fC._3Lgyp8').get(0);
        await browser.actions().mouseMove(electronics_locator).perform();
       
        let oppo_electronics = await $('a[title="OPPO"]');
        await oppo_electronics.click();
        await browser.sleep(5000);
        
        let oppo_a3 = 'https://www.flipkart.com/oppo-a3s-purple-16-gb/p/itmfcmuvhzthsyzw?pid=MOBF7FNVH5QGESQ4&lid=LSTMOBF7FNVH5QGESQ4RJITWA&marketplace=FLIPKART';
        await browser.get(oppo_a3   );
        
        let add_item_to_cart_button = await $('button._2AkmmA._2Npkh4._2MWPVK');
        await add_item_to_cart_button.click();
        await browser.sleep(5000);

        let flipkart_main_icon = await $('img._1e_EAo');
        await browser.wait(EC.elementToBeClickable(flipkart_main_icon), 8000)
        await flipkart_main_icon.click();

        await browser.sleep(5000);
        let header_cart_icon = await $('div._2dcihZ');
        await browser.wait(EC.elementToBeClickable(header_cart_icon), 8000);
        await header_cart_icon.click();
        await browser.sleep(5000);
        let place_order_btn = await element(by.className('_7UHT_c'));

        await place_order_btn.click();

        let login_form_email_input = await $('input._2zrpKA._14H79F[type="text"]');
        let test_cred_email = 'puja.bhattacharya.pb@gmail.com';
        await login_form_email_input.sendKeys(test_cred_email);

        let login_continue_button = $('button._2AkmmA._1poQZq._7UHT_c[type="submit"]');
        await login_continue_button.click();
        let test_cred_pwd = 'Illuminati@9';
        let login_form_pwd_input = await $('input._2zrpKA._3v41xv._14H79F[type="password"]') ;
        await login_form_pwd_input.sendKeys(test_cred_pwd);
        let continue_button = await $('button._2AkmmA._1poQZq._7UHT_c') ;
        await continue_button.click();
        let deliver_here_button = await $('button._2AkmmA._I6-pD._7UHT_c');
        await deliver_here_button.click();
        let continue_order_to_payment = await $('button._2AkmmA._2Q4i61._7UHT_c')    ;
        await continue_order_to_payment.click();
        await browser.sleep(4000);
        await browser.sleep(2000);
        let netbanking_bank_option_radio = await $$('div._6ATDKp').get(2);
        await netbanking_bank_option_radio.click();
      
        let netbanking_select_bank = await $('select._1CV081');
        await browser.wait(EC.elementToBeClickable(netbanking_select_bank),2000);
        await netbanking_select_bank.click();
        let netbanking_select_c_bank = await $('option[value="CORPORATION"]');
        await netbanking_select_c_bank.click();
        let netbanking_pay_button = $('button._2AkmmA._2BikcQ._7UHT_c');
        await browser.wait(EC.elementToBeClickable(netbanking_pay_button),2000);
        await netbanking_pay_button.click();
        
        let corp_bank_header = $('div.header-main');
        await browser.wait(EC.visibilityOf(corp_bank_header));
        let png = await browser.takeScreenshot();
        let stream = createWriteStream("bank_landing_page_screenshot.png");
        stream.write(new Buffer(png, 'base64'));
        stream.end();   
        
    });




});

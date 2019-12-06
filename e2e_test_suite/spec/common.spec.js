"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
const fs_1 = require("fs");
describe('Flipkart', () => {
    let homepage_url = "https://www.flipkart.com/";
    let EC = protractor_1.protractor.ExpectedConditions;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield protractor_1.browser.get(homepage_url);
    }));
    it('should open https://www.flipkart.com/ in an un-signed state', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(protractor_1.browser.getCurrentUrl()).toEqual(homepage_url);
        yield protractor_1.browser.actions().sendKeys(protractor_1.protractor.Key.ESCAPE).perform();
        let electronics_locator = protractor_1.$$('span._1QZ6fC._3Lgyp8').get(0);
        yield protractor_1.browser.actions().mouseMove(electronics_locator).perform();
        let oppo_electronics = yield protractor_1.$('a[title="OPPO"]');
        yield oppo_electronics.click();
        yield protractor_1.browser.sleep(5000);
        let oppo_a3 = 'https://www.flipkart.com/oppo-a3s-purple-16-gb/p/itmfcmuvhzthsyzw?pid=MOBF7FNVH5QGESQ4&lid=LSTMOBF7FNVH5QGESQ4RJITWA&marketplace=FLIPKART';
        yield protractor_1.browser.get(oppo_a3);
        let add_item_to_cart_button = yield protractor_1.$('button._2AkmmA._2Npkh4._2MWPVK');
        yield add_item_to_cart_button.click();
        yield protractor_1.browser.sleep(5000);
        let flipkart_main_icon = yield protractor_1.$('img._1e_EAo');
        yield protractor_1.browser.wait(EC.elementToBeClickable(flipkart_main_icon), 8000);
        yield flipkart_main_icon.click();
        yield protractor_1.browser.sleep(5000);
        let header_cart_icon = yield protractor_1.$('div._2dcihZ');
        yield protractor_1.browser.wait(EC.elementToBeClickable(header_cart_icon), 8000);
        yield header_cart_icon.click();
        yield protractor_1.browser.sleep(5000);
        let place_order_btn = yield protractor_1.element(protractor_1.by.className('_7UHT_c'));
        yield place_order_btn.click();
        let login_form_email_input = yield protractor_1.$('input._2zrpKA._14H79F[type="text"]');
        let test_cred_email = 'puja.bhattacharya.pb@gmail.com';
        yield login_form_email_input.sendKeys(test_cred_email);
        let login_continue_button = protractor_1.$('button._2AkmmA._1poQZq._7UHT_c[type="submit"]');
        yield login_continue_button.click();
        let test_cred_pwd = 'Illuminati@9';
        let login_form_pwd_input = yield protractor_1.$('input._2zrpKA._3v41xv._14H79F[type="password"]');
        yield login_form_pwd_input.sendKeys(test_cred_pwd);
        let continue_button = yield protractor_1.$('button._2AkmmA._1poQZq._7UHT_c');
        yield continue_button.click();
        let deliver_here_button = yield protractor_1.$('button._2AkmmA._I6-pD._7UHT_c');
        yield deliver_here_button.click();
        let continue_order_to_payment = yield protractor_1.$('button._2AkmmA._2Q4i61._7UHT_c');
        yield continue_order_to_payment.click();
        yield protractor_1.browser.sleep(4000);
        yield protractor_1.browser.sleep(2000);
        let netbanking_bank_option_radio = yield protractor_1.$$('div._6ATDKp').get(2);
        yield netbanking_bank_option_radio.click();
        let netbanking_select_bank = yield protractor_1.$('select._1CV081');
        yield protractor_1.browser.wait(EC.elementToBeClickable(netbanking_select_bank), 2000);
        yield netbanking_select_bank.click();
        let netbanking_select_c_bank = yield protractor_1.$('option[value="CORPORATION"]');
        yield netbanking_select_c_bank.click();
        let netbanking_pay_button = protractor_1.$('button._2AkmmA._2BikcQ._7UHT_c');
        yield protractor_1.browser.wait(EC.elementToBeClickable(netbanking_pay_button), 2000);
        yield netbanking_pay_button.click();
        let corp_bank_header = protractor_1.$('div.header-main');
        yield protractor_1.browser.wait(EC.visibilityOf(corp_bank_header));
        let png = yield protractor_1.browser.takeScreenshot();
        let stream = fs_1.createWriteStream("bank_landing_page_screenshot.png");
        stream.write(new Buffer(png, 'base64'));
        stream.end();
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb21tb24uc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLDJDQUF1RTtBQUN2RSwyQkFBdUM7QUFFdkMsUUFBUSxDQUFDLFVBQVUsRUFBQyxHQUFFLEVBQUU7SUFDcEIsSUFBSSxZQUFZLEdBQUcsMkJBQTJCLENBQUM7SUFDL0MsSUFBSyxFQUFFLEdBQUcsdUJBQVUsQ0FBQyxrQkFBa0IsQ0FBQztJQUV4QyxVQUFVLENBQUMsR0FBTyxFQUFFO1FBQ2hCLE1BQU0sb0JBQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDcEMsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw2REFBNkQsRUFBQyxHQUFRLEVBQUU7UUFFdkUsTUFBTSxDQUFDLG9CQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdEQsTUFBTSxvQkFBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsQ0FBQyx1QkFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVsRSxJQUFJLG1CQUFtQixHQUFHLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RCxNQUFNLG9CQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFakUsSUFBSSxnQkFBZ0IsR0FBRyxNQUFNLGNBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDL0IsTUFBTSxvQkFBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUxQixJQUFJLE9BQU8sR0FBRywySUFBMkksQ0FBQztRQUMxSixNQUFNLG9C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
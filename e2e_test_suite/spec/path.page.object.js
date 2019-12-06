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
function oppo_electronics() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('a[title="OPPO"]');
    });
}
// export class PageObjectClass{
// electronics_locator = $$('span._1QZ6fC._3Lgyp8').get(0);
// oppo_electronics = await $('a[title="OPPO"]');
// oppo_a3 = 'https://www.flipkart.com/oppo-a3s-purple-16-gb/p/itmfcmuvhzthsyzw?pid=MOBF7FNVH5QGESQ4&lid=LSTMOBF7FNVH5QGESQ4RJITWA&marketplace=FLIPKART';
// add_item_to_cart_button = await $('button._2AkmmA._2Npkh4._2MWPVK');
// flipkart_main_icon = await $('img._1e_EAo');
// header_cart_icon = await $('div._2dcihZ');
// place_order_btn = await element(by.className('_7UHT_c'));
// login_form_email_input = await $('input._2zrpKA._14H79F[type="text"]');
// test_cred_email = 'puja.bhattacharya.pb@gmail.com';
// login_continue_button = $('button._2AkmmA._1poQZq._7UHT_c[type="submit"]');
// test_cred_pwd = 'Illuminati@9';
// login_form_pwd_input = await $('input._2zrpKA._3v41xv._14H79F[type="password"]') ;
// continue_button = await $('button._2AkmmA._1poQZq._7UHT_c') ;
// deliver_here_button = await $('button._2AkmmA._I6-pD._7UHT_c');
// continue_order_to_payment = await $('button._2AkmmA._2Q4i61._7UHT_c')    ;
// netbanking_bank_option_radio = await $$('div._6ATDKp').get(2);
// netbanking_select_bank = await $('select._1CV081');
// netbanking_select_c_bank = await $('option[value="CORPORATION"]');
// netbanking_pay_button = $('button._2AkmmA._2BikcQ._7UHT_c');
// corp_bank_header = await $('div.header-main');
// }
function electronics_locator() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$$('span._1QZ6fC._3Lgyp8').get(0);
    });
}
function add_item_to_cart_button() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('button._2AkmmA._2Npkh4._2MWPVK');
    });
}
function flipkart_main_icon() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('img._1e_EAo');
    });
}
function header_cart_icon() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('div._2dcihZ');
    });
}
function place_order_btn() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.element(protractor_1.by.className('_7UHT_c'));
    });
}
function login_form_email_input() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('input._2zrpKA._14H79F[type="text"]');
    });
}
function login_continue_button() {
    return __awaiter(this, void 0, void 0, function* () {
        protractor_1.$('button._2AkmmA._1poQZq._7UHT_c[type="submit"]');
    });
}
function login_form_pwd_input() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('input._2zrpKA._3v41xv._14H79F[type="password"]');
    });
}
function continue_button() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('button._2AkmmA._1poQZq._7UHT_c');
    });
}
function deliver_here_button() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('button._2AkmmA._I6-pD._7UHT_c');
    });
}
function continue_order_to_payment() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('button._2AkmmA._2Q4i61._7UHT_c');
    });
}
function netbanking_bank_option_radio() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$$('div._6ATDKp').get(2);
    });
}
function netbanking_select_bank() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('select._1CV081');
    });
}
function netbanking_select_c_bank() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('option[value="CORPORATION"]');
    });
}
function netbanking_pay_button() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('button._2AkmmA._2BikcQ._7UHT_c');
    });
}
function bankheader() {
    return __awaiter(this, void 0, void 0, function* () {
        yield protractor_1.$('div.header-main');
    });
}
module.exports = {
    bankheader,
    netbanking_pay_button,
    netbanking_select_bank,
    netbanking_select_c_bank,
    netbanking_bank_option_radio,
    deliver_here_button,
    continue_button,
    login_form_pwd_input,
    login_continue_button,
    add_item_to_cart_button,
    flipkart_main_icon,
    header_cart_icon,
    place_order_btn,
    login_form_email_input,
    electronics_locator,
    oppo_electronics
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5wYWdlLm9iamVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBhdGgucGFnZS5vYmplY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBdUU7QUFFdkUsU0FBZSxnQkFBZ0I7O1FBQzNCLE1BQU0sY0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDL0IsQ0FBQztDQUFBO0FBRUQsZ0NBQWdDO0FBQzVCLDJEQUEyRDtBQUMzRCxpREFBaUQ7QUFDakQseUpBQXlKO0FBQ3pKLHVFQUF1RTtBQUN2RSwrQ0FBK0M7QUFDL0MsNkNBQTZDO0FBQzdDLDREQUE0RDtBQUM1RCwwRUFBMEU7QUFDMUUsc0RBQXNEO0FBQ3RELDhFQUE4RTtBQUM5RSxrQ0FBa0M7QUFDbEMscUZBQXFGO0FBRXJGLGdFQUFnRTtBQUNoRSxrRUFBa0U7QUFDbEUsNkVBQTZFO0FBQzdFLGlFQUFpRTtBQUNqRSxzREFBc0Q7QUFDdEQscUVBQXFFO0FBQ3JFLCtEQUErRDtBQUMvRCxpREFBaUQ7QUFDckQsSUFBSTtBQUNILFNBQWUsbUJBQW1COztRQUM5QixNQUFNLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDO0NBQUE7QUFFSixTQUFlLHVCQUF1Qjs7UUFDbEMsTUFBTSxjQUFDLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztJQUMvQyxDQUFDO0NBQUE7QUFDQSxTQUFlLGtCQUFrQjs7UUFDN0IsTUFBTSxjQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUFBO0FBQ0EsU0FBZSxnQkFBZ0I7O1FBQzNCLE1BQU0sY0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzVCLENBQUM7Q0FBQTtBQUNBLFNBQWUsZUFBZTs7UUFDMUIsTUFBTSxvQkFBTyxDQUFDLGVBQUUsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDO0NBQUE7QUFDQSxTQUFlLHNCQUFzQjs7UUFDakMsTUFBTSxjQUFDLENBQUMsb0NBQW9DLENBQUMsQ0FBQztJQUNuRCxDQUFDO0NBQUE7QUFDQSxTQUFlLHFCQUFxQjs7UUFDaEMsY0FBQyxDQUFDLCtDQUErQyxDQUFDLENBQUM7SUFDeEQsQ0FBQztDQUFBO0FBQ0EsU0FBZSxvQkFBb0I7O1FBQy9CLE1BQU0sY0FBQyxDQUFDLGdEQUFnRCxDQUFDLENBQUU7SUFDaEUsQ0FBQztDQUFBO0FBQ0EsU0FBZSxlQUFlOztRQUMxQixNQUFNLGNBQUMsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FBQTtBQUNBLFNBQWUsbUJBQW1COztRQUM5QixNQUFNLGNBQUMsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FBQTtBQUNBLFNBQWUseUJBQXlCOztRQUNwQyxNQUFNLGNBQUMsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FBQTtBQUNBLFNBQWUsNEJBQTRCOztRQUN4QyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUFBO0FBQ0EsU0FBZSxzQkFBc0I7O1FBQ2pDLE1BQU0sY0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDL0IsQ0FBQztDQUFBO0FBQ0EsU0FBZSx3QkFBd0I7O1FBQ25DLE1BQU0sY0FBQyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUFBO0FBQ0EsU0FBZSxxQkFBcUI7O1FBQUssTUFBTSxjQUFDLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztJQUNwRixDQUFDO0NBQUE7QUFDQSxTQUFlLFVBQVU7O1FBQ3JCLE1BQU0sY0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUFBO0FBRUwsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNiLFVBQVU7SUFDVixxQkFBcUI7SUFDckIsc0JBQXNCO0lBQ3RCLHdCQUF3QjtJQUN4Qiw0QkFBNEI7SUFDNUIsbUJBQW1CO0lBQ25CLGVBQWU7SUFDZixvQkFBb0I7SUFDcEIscUJBQXFCO0lBQ3pCLHVCQUF1QjtJQUN2QixrQkFBa0I7SUFDbEIsZ0JBQWdCO0lBQ2hCLGVBQWU7SUFDZixzQkFBc0I7SUFDdEIsbUJBQW1CO0lBQ25CLGdCQUFnQjtDQUNmLENBQUEifQ==
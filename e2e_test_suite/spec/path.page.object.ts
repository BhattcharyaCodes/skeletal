import {element, by, By, $, $$, browser, protractor} from 'protractor';

async function oppo_electronics(){
    await $('a[title="OPPO"]');
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
 async function electronics_locator(){ 
     await $$('span._1QZ6fC._3Lgyp8').get(0);
    }

 async function add_item_to_cart_button(){  
     await $('button._2AkmmA._2Npkh4._2MWPVK');
}
 async function flipkart_main_icon(){   
     await $('img._1e_EAo');
}
 async function header_cart_icon(){   
     await $('div._2dcihZ');
}
 async function place_order_btn(){ 
     await element(by.className('_7UHT_c'));
}
 async function login_form_email_input(){  
     await $('input._2zrpKA._14H79F[type="text"]');
}
 async function login_continue_button(){  
     $('button._2AkmmA._1poQZq._7UHT_c[type="submit"]');
}
 async function login_form_pwd_input(){
     await $('input._2zrpKA._3v41xv._14H79F[type="password"]') ;
}
 async function continue_button(){ 
     await $('button._2AkmmA._1poQZq._7UHT_c');
}
 async function deliver_here_button(){    
     await $('button._2AkmmA._I6-pD._7UHT_c');
}
 async function continue_order_to_payment(){     
     await $('button._2AkmmA._2Q4i61._7UHT_c');
}
 async function netbanking_bank_option_radio(){  
    await $$('div._6ATDKp').get(2);
}
 async function netbanking_select_bank(){
     await $('select._1CV081');
}
 async function netbanking_select_c_bank(){
     await $('option[value="CORPORATION"]');
}
 async function netbanking_pay_button(){  await $('button._2AkmmA._2BikcQ._7UHT_c');
}
 async function bankheader(){
     await $('div.header-main');
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
add_item_to_cart_button ,
flipkart_main_icon ,
header_cart_icon ,
place_order_btn,
login_form_email_input,
electronics_locator ,
oppo_electronics 
}

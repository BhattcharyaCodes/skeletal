import { browser, element, by, By, $, $$, ExpectedConditions, protractor } from 'protractor';


export class Homepage_page_object{  
    input_box = $('input.gLFyf');
    google_img = element(by.id('hplogo'));
    feeling_lucky_button = element.all(by.css('input.RNmpXc[type="submit"]')).first();
    voice_search_icon = $("span.HPVvwb");
    google_search_button =  $('input.gNO89b[value="Google Search"]');
    result_string = element(by.id('resultStats'));
    image_tab_locator = $('div.hdtb-mitem.hdtb-msel.hdtb-imb');
    image_result_list = $('div.THL2l');

        
}


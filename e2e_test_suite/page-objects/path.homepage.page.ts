import { browser, element, by, By, $, $$, ExpectedConditions, protractor } from 'protractor';


export class Homepage_page_object{  
    input_box = $('input.gLFyf');
    google_img = element(by.id('hplogo'));
    feeling_lucky_button = element.all(by.css('input.RNmpXc[type="submit"]')).first();
    
    google_search_button =  $('input.gNO89b[value="Google Search"]');
    result_string = element(by.id('resultStats'));
        
}


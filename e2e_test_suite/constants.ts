export class Test_data_declarations{
    search_text = 'gibberish';
    google_home_page_url = 'https://www.google.com/';
    google_img_style = 'padding-top: 109px;';
    doodle_url = 'https://www.google.com/doodles/';
    search_text_invalid_inputs = "Your search - ";
    maximum_len = '2048'; //maxlength attribute name for input
    invalid_entries: string[] = ['*', '#', '$' , '%', ' '] ;
    expected_string = "Your search - * - did not match any documents.";
}
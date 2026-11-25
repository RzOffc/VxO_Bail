export interface RichTextInput {
    title?: string;
    body?: string;
    footer?: string;
    [option: string]: any;
}
export interface RichImageInput extends RichTextInput {
    image: any;
}
export declare const RichMessage: Readonly<{
    text(input?: RichTextInput): { text: string; [option: string]: any };
    image(input: RichImageInput): { image: any; caption: string; [option: string]: any };
}>;
export declare const VamMessage: Readonly<{
    text(text: string, options?: object): any;
    richText(input?: RichTextInput): any;
    rich(input?: RichTextInput | RichImageInput): any;
    image(image: any, options?: object): any;
    video(video: any, options?: object): any;
    audio(audio: any, options?: object): any;
    document(document: any, options?: object): any;
    sticker(sticker: any, options?: object): any;
    location(degreesLatitude: number, degreesLongitude: number, options?: object): any;
    contact(displayName: string, vcard: string, options?: object): any;
    poll(name: string, values: string[], selectableCount?: number, options?: object): any;
    reaction(key: object, text: string, options?: object): any;
    forward(message: any, options?: { force?: boolean; [option: string]: any }): any;
}>;
export declare const vamMessage: typeof VamMessage;
export declare function buildVamMessage(content: object): any;

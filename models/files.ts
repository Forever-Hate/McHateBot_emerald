//config檔
export interface Config {
    readonly ip: string,
    readonly port: number,
    readonly username: string,
    readonly version:string,
    readonly auth: string,
    readonly language: string,
    readonly whitelist: string[]
}
//setting檔
export interface Setting {
    readonly store_emerald_interval:number;
    readonly store_emerald_check_times:number;
    readonly enable_store_log:boolean;
    readonly enable_auto_repair:boolean;
    readonly enable_auto_send_store_report:boolean;
    readonly enable_multiple_place_store:boolean;
    readonly store_place:string[];
    readonly enable_afk_after_store:boolean;
    readonly afk_place:string[]

    readonly enable_pay_log:boolean;
    readonly transfer_interval:number;

    readonly enable_trade_announcement: boolean;
    readonly trade_announce_cycleTime: number;
    readonly enable_trade_content_cycle: boolean;
    readonly content_skip_count: number;
    readonly trade_content: string[][];
    
    readonly enable_reply_msg: boolean;
    readonly forward_ID: string;
    readonly clear_reply_id_delay_time: number;
    readonly enable_auto_reply: boolean;
    readonly auto_reply_week: string;
    readonly auto_reply_time: string;
    readonly auto_reply_content: string;
    
    readonly enable_discord_bot: boolean;
    readonly forward_DC_ID: string[];
    readonly enable_send_msg_to_channel: boolean;
    readonly directly_send_msg_to_dc: boolean;
    readonly channel_ID: string;
    readonly embed_thumbnail_url:string;
    readonly enable_slash_command:boolean;
    readonly bot_application_ID:string;
    readonly bot_token: string;
}
// 語言檔
export interface Language {
    [key: string]: string | string[];
    readonly LOADING_DONE: string;
    readonly SHUTDOWN: string;
    readonly WELCOME_BANNER:string[];

    readonly NEED_MORE_CONTENT: string;
    readonly NEXT_INDEX: string;
    readonly CONTENT: string;

    readonly EXP: string;
    readonly HELP: string;
    readonly COMMAND_LIST:string[];
    readonly VERSION: string;
    readonly ABOUT: string[];

    readonly REPLIED: string;
    readonly NO_ONE_REPLIED: string;
    readonly OFFLINE: string;
    readonly FORWARD_TO_DC: string;
    readonly FORWARDED_IN_GAME: string;

    readonly DC_BANNER: string;
    readonly DC_BOT_ONLINE: string;
    readonly DC_BOT_OFFLINE: string;
    readonly DC_USER_FOUND: string;
    readonly DC_USER_NOT_FOUND: string;
    readonly DC_SLASH_COMMAND_REGISTERED:string;
    readonly DC_SLASH_COMMAND_NOT_REGISTERED:string;
    readonly DC_FORWARD_CHANNEL_NOT_FOUND: string;
    readonly DC_COMMAND_EXECUTED: string;
    readonly DC_COMMAND_EXECUTED_FAIL:string;
    readonly DC_NO_PERMISSION: string;
    readonly DC_RESPONSE_MSG: string;

    readonly FINANCE_CHECK_BALANCE:string;
    readonly FINANCE_PAY_FORMAT_ERROR:string;
    readonly FINANCE_PAY_PROCESSING:string;
    readonly FINANCE_PAY_BALANCE_NOT_ENOUGH_ERROR:string;
    readonly FINANCE_ZERO_OR_NEGATIVE_EXPENCE_ERROR:string;
    readonly FINANCE_NOT_IN_THE_SAME_SERVER_ERROR:string;
    readonly FINANCE_TRANSFER_MONEY_TO_SOMEONE:string;
    readonly FINANCE_PREPARE_TRANSFER_MONEY:string;
    readonly FINANCE_PAY_COMPLETE:string;
    readonly FINANCE_PAY_FAIL:string;
    readonly FINANCE_PAY_FAIL_TO_OWNER:string;
    readonly FINANCE_TRANSFER_MONEY_CANCELED:string;
    readonly FINANCE_TRANSFER_MONEY_CANCELED_TO_OWNER:string;
    readonly FINANCE_NO_TRANSFER_MONEY_ACROSS_SERVER:string;

    readonly AFK_ON_THE_WAY:string;
    readonly AFK_FOUND_PLACE:string;
    readonly AFK_NOT_ENOUGH_PLACE_ERROR:string;
    readonly AFK_CANT_GO_THETE_ERROR:string;
    readonly AFK_FOUND_MINECART:string;
    readonly AFK_NOT_FOUND_MINECART:string;
    readonly AFK_PLACE_NOT_FOUND:string;
    
    readonly STORE_SHOW_LOG_IN_CONSOLE:string;
    readonly STORE_BANNER:string;
    readonly STORE_LINE_1:string;
    readonly STORE_LINE_2:string;
    readonly STORE_LINE_3:string;
    readonly STORE_LINE_4:string;
    readonly STORE_LINE_5:string;
    readonly STORE_LINE_6:string;
    readonly STORE_LINE_7:string;
    readonly STORE_LINE_8:string;

    readonly STORE_NOT_ENOUGH_PLACE_ERROR:string;
    readonly STORE_ON_THE_WAY:string;
    readonly STORE_FOUND_PLACE:string;
    readonly STORE_GO_TO_NEXT_PLACE:string;
    readonly STORE_CANT_GO_THETE_ERROR:string;
    readonly STORE_STOP:string;
    readonly STORE_START:string;
    readonly STORE_DONE:string;
    readonly STORE_NOT_PROCESS_ERROR:string;
    readonly STORE_NOT_ENOUGH_INVENTORY_ERROR:string;
    readonly STORE_SHULKER_BOX_NOT_FOUND_ERROR:string;
    readonly STORE_SHULKER_BOX_EMPTY_ERROR:string;
    readonly STORE_SHULKER_BOX_HAS_TRASH_ERROR:string;
    readonly STORE_FORMAT_ERROR:string;

}
import {SetMetadata} from "@nestjs/common";

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const USERLEVEL_KEY = 'userlevel';
export const Userlevel = (userlevel:number) => SetMetadata(USERLEVEL_KEY, userlevel);

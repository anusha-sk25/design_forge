import React from "react";
import styles from "./Avatar.module.css";
import Image from "next/image";
//import { Tooltip, TooltipContent, TooltipTrigge} from "../ui/tooltip"
/*type Props = {
    name: string;
    otherStyles?: string;
  };
  */
export function Avatar ({ name, otherStyles }:{otherStyles:
string;name:string} ){

   return(
        <div className={`${styles.avatar} ${otherStyles} h-9 w-9`} data-tooltip={name}>
          <Image
            src={`https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 30)}.png`}
            fill
            className="rounded-full"
            alt={name}
          />
        </div>
     
)
   }

/*
const Avatar = ({ name, otherStyles }: Props) => (
    <>
    <Tooltip>
      <TooltipTrigger>
        <div className={`relative h-9 w-9 rounded-full ${otherStyles}`} data-tooltip={name}>
          <Image
            src={`https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 30)}.png`}
            fill
            className="rounded-full"
            alt={name}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="border-none bg-primary-grey-200 px-2.5 py-1.5 text-xs">
        {name}
      </TooltipContent>
    </Tooltip>
  </>
)
export default Avatar;*/
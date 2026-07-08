import { customAlphabet } from "nanoid";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const generarToken = customAlphabet(alphabet, 10);

declare module "crypto-js" {
  export interface CipherParams {
    toString(format?: any): string;
  }

  export interface WordArray {
    toString(encoding?: any): string;
  }

  export interface AESStatic {
    encrypt(message: string, secret: string): CipherParams;
    decrypt(encrypted: string, secret: string): WordArray;
  }

  export const AES: AESStatic;
  
  export const enc: {
    Utf8: {
      parse(string: string): WordArray;
    };
  };

  const CryptoJS: {
    AES: AESStatic;
    enc: {
      Utf8: {
        parse(string: string): WordArray;
      };
    };
  };
  
  export default CryptoJS;
}

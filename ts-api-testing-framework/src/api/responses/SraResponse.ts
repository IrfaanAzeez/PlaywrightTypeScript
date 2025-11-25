import { BaseResponse, IResponse  } from "./BaseResponse";

export interface SraData {
  id?: string;
  paramName?: string;
  paramValue?: string;
  description?: string;
  [key: string]: any;
}

export class SraResponse extends BaseResponse {
  private sraData: SraData[] = [];
  private singleData: SraData | null = null;

  constructor(response: IResponse) {
    super(response);
    this.extractSraData();
  }

  private extractSraData(): void {
    if (this.isSuccess()) {
      if (Array.isArray(this.data)) {
        this.sraData = this.data;
      } else if (typeof this.data === 'object' && this.data !== null) {
        if (this.data.data && Array.isArray(this.data.data)) {
          this.sraData = this.data.data;
        } else {
          this.singleData = this.data;
        }
      }
    }
  }

  public getSraData(): SraData[] {
    return this.sraData;
  }

public hasData(): boolean {
    return this.sraData.length > 0 || this.singleData !== null;
  }
}


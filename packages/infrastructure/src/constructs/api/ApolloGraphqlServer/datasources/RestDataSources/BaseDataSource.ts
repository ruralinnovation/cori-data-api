import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';
import { EnvConfig } from '../../EnvConfig';
export class BaseDataSource extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = `${EnvConfig.PYTHON_API_URL}`;
  }

  willSendRequest(request: RequestOptions) {
    request.headers.set('Authorization', this.context.headers.Authorization);
  }
  async getItem(path?: string) {
    const res = await this.get(path ? path : '', undefined);

    console.log("Response from dataSource: ",  (() => {
      const properties = [];
      for (let p in res) {
        if (res.hasOwnProperty(p)) {
          // @ts-ignore
          properties.push(p + ": " + JSON.stringify(res[p], null, 2) + "\n");
        }
      }
      return properties;
    })());

    return res;
  }
}

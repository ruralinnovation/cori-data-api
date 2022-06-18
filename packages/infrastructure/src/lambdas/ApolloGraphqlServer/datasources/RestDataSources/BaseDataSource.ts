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
    console.log('REsponse ', res);
    console.log('Attr', Object.keys(res.features[0]));
    return res;
  }
}

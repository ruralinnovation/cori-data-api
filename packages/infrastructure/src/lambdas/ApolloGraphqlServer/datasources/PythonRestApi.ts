import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';
import { EnvConfig } from '../EnvConfig';
export class PythonRestApi extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = `${EnvConfig.PYTHON_API_URL}`;
  }

  willSendRequest(request: RequestOptions) {
    console.log('Request :', request);
    request.headers.set('Authorization', this.context.token);
  }
  async getItem(path?: string) {
    console.log('URL ', this.baseURL);
    const items = !path ? this.get('hello') : this.get(path);
    console.log(items);
    return await items;
  }
}

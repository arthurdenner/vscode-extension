import { AxiosResponse } from 'axios';
import { Subject } from 'rxjs';
import { ISnykApiClient } from '../../common/api/apiСlient';
import { OssResult, OssResultBody, OssVulnerability } from '../../snykOss/ossResult';
import { ModuleVulnerabilityCount } from '../../snykOss/services/vulnerabilityCount/importedModule';
import { AdvisorScore } from '../advisorTypes';

export default class AdvisorService {
  protected scores: AdvisorScore[];
  readonly scanFinished$ = new Subject<void>();
  private _vulnerabilities: ModuleVulnerabilityCount[];
  private readonly api = `/unstable/advisor/scores/npm-package`;

  get vulnerabilities(): ModuleVulnerabilityCount[] {
    return this._vulnerabilities;
  }
  private set vulnerabilities(vulnerabilities: ModuleVulnerabilityCount[]) {
    this._vulnerabilities = vulnerabilities;
  }

  constructor(private readonly snykApiClient: ISnykApiClient) {}

  public getScoresResult = (): AdvisorScore[] | undefined => this.scores;

  public async setScores(ossResult: OssResult): Promise<AdvisorScore | Error> {
    const scores: AdvisorScore = null;
    try {
      const vulnerabilities = (ossResult as OssResultBody).vulnerabilities || [];
      const res: AxiosResponse = await this.snykApiClient.post(
        this.api,
        vulnerabilities.map((vuln: OssVulnerability) => vuln.name),
      );
      if (res.data) {
        this.scores = res.data as AdvisorScore[];
        this.scanFinished$.next();
        return res.data as AdvisorScore;
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error('Failed to get scores', err.message);
      }
    }
    return scores;
  }
}

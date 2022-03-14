import { AxiosResponse } from 'axios';
import { Subject } from 'rxjs';
import { ILog } from '../../common/logger/interfaces';
import { ImportedModule } from '../../common/types';
import { AdvisorScore } from '../advisorTypes';
import { IAdvisorApiClient } from './advisorApiClient';

export default class AdvisorService {
  protected scores: AdvisorScore[];
  readonly scanFinished$ = new Subject<void>();
  private memPackages: string[] = [];

  constructor(private readonly advisorApiClient: IAdvisorApiClient, private readonly logger: ILog) {}

  public getScoresResult = (): AdvisorScore[] | undefined => this.scores;

  public async getScores(modules: ImportedModule[]): Promise<AdvisorScore[]> {
    const scores: AdvisorScore[] = [];
    try {
      const packages = modules.map(({ name }) => name);
      if (!packages.filter(pkg => !this.memPackages.includes(pkg)).length) {
        return this.scores;
      }
      if (!packages.length) {
        return scores;
      }
      const res: AxiosResponse = await this.advisorApiClient.post(
        this.advisorApiClient.apiPath,
        modules.map(({ name }) => name),
      );

      if (res.data) {
        this.scores = res.data as AdvisorScore[];
        this.memPackages = this.scores.map(advisorScore => {
          if (!advisorScore) {
            return '';
          }
          if (!advisorScore.name) {
            return '';
          }
          return advisorScore.name;
        });
        this.scanFinished$.next();
        return res.data as AdvisorScore[];
      }
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(`Failed to get scores: ${err.message}`);
      }
    }
    return scores;
  }
}

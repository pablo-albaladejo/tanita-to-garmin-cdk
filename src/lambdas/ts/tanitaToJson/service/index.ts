import { isValidCSV, csvToJson } from '../../helpers/csv';
import { filterJsonByItemDate } from '../../helpers/json';
import TanitaOptions from '../interfaces/tanitaOptions';
import { TanitaRepository } from '../repository';

export class TanitaService {
  private repository: TanitaRepository;
  private options: TanitaOptions;

  constructor(options: TanitaOptions) {
    this.repository = new TanitaRepository();
    this.options = options;
  }

  getMeasurementsByDateRage = async (startDate?: string, endDate?: string) => {
    console.log('TanitaService.getMeasurementsByDateRage', startDate, endDate);
    await this.repository.init(this.options);

    const csvData = await this.repository.exportCSV();
    if (!isValidCSV(csvData)) throw new Error('Invalid Tanita response');

    await this.repository.dispose();

    // Date,"Weight (kg)",BMI,"Body Fat (%)","Visc Fat","Muscle Mass (kg)","Muscle Quality","Bone Mass (kg)","BMR (kcal)","Metab Age","Body Water (%)","Physique Rating","Muscle mass - right arm","Muscle mass - left arm","Muscle mass - right leg","Muscle mass - left leg","Muscle mass - trunk","Muscle quality - right arm","Muscle quality - left arm","Muscle quality - right leg","Muscle quality - left leg","Muscle quality - trunk","Body fat (%) - right arm","Body fat (%) - left arm","Body fat (%) - right leg","Body fat (%) - left leg","Body fat (%) - trunk","Heart rate"
    const keys = [
      'date',
      'weight',
      'bmi',
      'body_fat',
      'visc_fat',
      'muscle_mass',
      'muscle_quality',
      'bone_mass',
      'bmr',
      'metab_age',
      'body_water',
      'physique_rating',
      'muscle_mass_right_arm',
      'muscle_mass_left_arm',
      'muscle_mass_right_leg',
      'muscle_mass_left_leg',
      'muscle_mass_trunk',
      'muscle_quality_right_arm',
      'muscle_quality_left_arm',
      'muscle_quality_right_leg',
      'muscle_quality_left_leg',
      'muscle_quality_trunk',
      'body_fat_right_arm',
      'body_fat_left_arm',
      'body_fat_right_leg',
      'body_fat_left_leg',
      'body_fat_trunk',
      'heart_rate',
    ];
    const jsonData = csvToJson(csvData, keys);

    return filterJsonByItemDate(jsonData, startDate, endDate);
  };
}

package fit.toolkit.handler;

import com.garmin.fit.Profile;
import com.garmin.fit.WeightScaleMesg;

public class WeightScaleMesgBMI extends WeightScaleMesg {
    public static final int BMINum = 13;

    public Float getBMI() {
        return this.getFieldFloatValue(BMINum, 0, 65535);
    }
    public void setBMI(Float var1) {
        this.setFieldValue(BMINum, 0, var1, 65535);
    }

    static {
        weightScaleMesg.addField(new FieldBMI("bmi", BMINum, 132, 10.0, 0.0, "", false, Profile.Type.UINT16));
    }

}

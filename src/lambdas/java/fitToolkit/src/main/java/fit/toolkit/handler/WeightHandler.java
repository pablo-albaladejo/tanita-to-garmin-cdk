package fit.toolkit.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import com.garmin.fit.*;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.text.SimpleDateFormat;
import java.time.ZonedDateTime;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class WeightHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    public WeightScaleMesg getWeightScaleMesg(JsonObject jsonObject) {
        WeightScaleMesgBMI wm = new WeightScaleMesgBMI();

        Date date = Date.from(ZonedDateTime.parse(jsonObject.get("date").getAsString()).toInstant());
        wm.setTimestamp(new DateTime(date));
        wm.setWeight(jsonObject.get("weight").getAsFloat());
        wm.setPercentFat(jsonObject.get("body_fat").getAsFloat());
        wm.setPercentHydration(jsonObject.get("body_water").getAsFloat());
        wm.setMuscleMass(jsonObject.get("muscle_mass").getAsFloat());
        wm.setBasalMet(jsonObject.get("bmr").getAsFloat());
        wm.setPhysiqueRating(jsonObject.get("physique_rating").getAsShort());
        wm.setVisceralFatRating(jsonObject.get("visc_fat").getAsShort());
        wm.setBoneMass(jsonObject.get("bone_mass").getAsFloat());
        wm.setMetabolicAge(jsonObject.get("metab_age").getAsShort());
        wm.setBMI(jsonObject.get("bmi").getAsFloat());
        return wm;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        SimpleDateFormat fileNameFormatter = new SimpleDateFormat("yyyyMMdd_kkmmss");
        String filename = "ws_" + fileNameFormatter.format(new Date()) + ".fit";
        File file = new File("/tmp/", filename);

        try {
            FileEncoder encoder = new FileEncoder(file, Fit.ProtocolVersion.V1_0);

            FileIdMesg fileIdMesg = new FileIdMesg();
            fileIdMesg.setType(com.garmin.fit.File.WEIGHT);
            fileIdMesg.setManufacturer(Manufacturer.TANITA);
            fileIdMesg.setProduct(1);
            fileIdMesg.setSerialNumber(1L);
            encoder.write(fileIdMesg);

            String bodyString = event.getBody();
            JsonArray dataArray = new Gson().fromJson(bodyString, JsonArray.class);

            dataArray.forEach(jsonElement -> {
                WeightScaleMesg wm = getWeightScaleMesg(jsonElement.getAsJsonObject());
                encoder.write(wm);
            });

            encoder.close();

            byte[] fileBytes = Files.readAllBytes(file.toPath());

            String base64Binary = Base64.getEncoder().encodeToString(fileBytes);

            APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
            response.setStatusCode(200);

            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", "application/octet-stream");
            response.setHeaders(headers);

            response.setBody(base64Binary);
            return response;

        } catch (IOException e) {
            context.getLogger().log("Error processing CSV: " + e.getMessage());
            APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
            response.setStatusCode(500);
            response.setBody("Error processing CSV to FIT file.");
            return response;
        }
    }
}

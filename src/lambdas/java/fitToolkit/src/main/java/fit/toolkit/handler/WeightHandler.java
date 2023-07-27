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

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
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
        SimpleDateFormat fileNameFormater = new SimpleDateFormat("yyyyMMdd_kkmmss");
        String filename = "ws_" + fileNameFormater.format(new Date()) + ".fit";
        FileEncoder encoder = new FileEncoder(new File("/tmp/", filename), Fit.ProtocolVersion.V1_0);

        FileIdMesg fileIdMesg = new FileIdMesg();
        fileIdMesg.setType(com.garmin.fit.File.WEIGHT);
        fileIdMesg.setManufacturer(Manufacturer.TANITA);
        fileIdMesg.setProduct(1);
        fileIdMesg.setSerialNumber(1L);
        encoder.write(fileIdMesg);

        String json = event.getBody();
        JsonArray jsonArray = new Gson().fromJson(json, JsonArray.class);
        jsonArray.forEach(jsonElement -> {
            WeightScaleMesg wm = getWeightScaleMesg(jsonElement.getAsJsonObject());
            encoder.write(wm);
        });

        encoder.close();
        try {
            String b64 = encodeFileToBase64Binary("/tmp/" + filename);

            APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
            response.setStatusCode(200);

            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", "application/octet-stream");
            headers.put("X-Custom-Header", "application/octet-stream");
            headers.put("Content-Disposition", "attachment; filename=\"" + filename + "\"");
            response.setHeaders(headers);

            response.setBody(b64);
            response.setIsBase64Encoded(true);

            return response;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

    }

    private String encodeFileToBase64Binary(String fileName) throws IOException {
        File file = new File(fileName);
        byte[] bytes = loadFile(file);
        byte[] encoded = Base64.getEncoder().encode(bytes);
        String encodedString = new String(encoded);
        return encodedString;
    }

    private static byte[] loadFile(File file) throws IOException {
        InputStream is = new FileInputStream(file);

        long length = file.length();
        if (length > Integer.MAX_VALUE) {
            // File is too large
        }
        byte[] bytes = new byte[(int) length];

        int offset = 0;
        int numRead = 0;
        while (offset < bytes.length
                && (numRead = is.read(bytes, offset, bytes.length - offset)) >= 0) {
            offset += numRead;
        }

        if (offset < bytes.length) {
            throw new IOException("Could not completely read file " + file.getName());
        }

        is.close();
        return bytes;
    }
}
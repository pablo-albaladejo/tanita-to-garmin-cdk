#!/bin/bash

# Root directory where the subdirectories are located
root_directory="src/lambdas/java"

# Path to the fit.jar file within the root_directory
fit_jar="$root_directory/fitToolkit/libs/fit.jar"

# Check if the root directory exists
if [ ! -d "$root_directory" ]; then
  echo "Root directory does not exist: $root_directory"
  exit 1
fi

# Check if the fit.jar file exists in the /libs directory under root_directory
if [ ! -f "$fit_jar" ]; then
  echo "fit.jar file does not exist: $fit_jar"
  exit 1
fi

# Install fit.jar as a local Maven dependency
echo "Installing fit.jar as a local Maven dependency..."
mvn install:install-file \
    -Dfile="$fit_jar" \
    -DgroupId=com.garmin.fit \
    -DartifactId=fit \
    -Dversion=1.0.0 \
    -Dpackaging=jar

# Loop to iterate through all subdirectories and run "mvn package"
for subdirectory in "$root_directory"/*; do
  if [ -d "$subdirectory" ]; then
    echo "Running 'mvn package' on: $subdirectory"
    # Change to the project directory and run "mvn package"
    (cd "$subdirectory" && mvn package)
    echo "Finished 'mvn package' on: $subdirectory"
  fi
done

#!/bin/bash

set -e

image_name="epoxy_image_${SESSION_ID}"
container_name="epoxy_container_${SESSION_ID}"

cmd="/bin/bash -c \"source activate env1 && jupyter lab --ip=0.0.0.0 --port=$PORT --allow-root --no-browser --NotebookApp.token=''\""

cmd2="docker run -p $PORT:$PORT --name=${container_name} -t ${image_name} ${cmd}"
echo $cmd2
/bin/bash -c "${cmd2}"
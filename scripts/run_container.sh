#!/bin/bash

set -e

image_name="epoxy_image_${SESSION_ID}"
container_name="epoxy_container_${SESSION_ID}"

flags="--name=${container_name} -t"
if [[ ! -z "${PORT}" ]]; then
	flags="-p $PORT:$PORT ${flags}"
fi

if [ "${EPOXY_RUN_MODE}" == "jupyterlab" ]; then
	cmd1="jupyter lab --ip=0.0.0.0 --port=$PORT --allow-root --no-browser --NotebookApp.token='${EPOXY_JUPYTER_TOKEN}'"
elif [ "${EPOXY_RUN_MODE}" == "bash" ]; then
	cmd1="/bin/bash"
	flags="${flags} -i"
elif [ "${EPOXY_RUN_MODE}" == "command" ]; then
	cmd1="${EPOXY_RUN_COMMAND}"
else
	echo "Invalid run mode: ${EPOXY_RUN_MODE}"
	exit -1
fi

if [[ "${EPOXY_CAPSULE_MODE}" != "true" ]]; then
	cmd1="source activate env1 && ${cmd1}"
fi

if [[ ! -z "${EPOXY_MOUNT_WORKSPACE}" ]]; then
	flags="${flags} -v ${EPOXY_MOUNT_WORKSPACE}:/workspace_mounted"
	cmd1="cd /workspace_mounted && ${cmd1}"
fi

cmd2="/bin/bash -c \"${cmd1}\""

cmd3="docker run ${flags} ${image_name} ${cmd2}"
echo $cmd3
/bin/bash -c "${cmd3}"
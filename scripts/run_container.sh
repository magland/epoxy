#!/bin/bash

set -e

image_name="epoxy_image_${SESSION_ID}"
container_name="epoxy_container_${SESSION_ID}"

docker_args="--name=${container_name} -t"
if [[ ! -z "${PORT}" ]]; then
	docker_args="-p $PORT:$PORT ${docker_args}"
fi

if [ "${EPOXY_RUN_MODE}" == "jupyterlab" ]; then
	cmd1="jupyter lab --ip=0.0.0.0 --port=$PORT --allow-root --no-browser --NotebookApp.token='${EPOXY_JUPYTER_TOKEN}'"
elif [ "${EPOXY_RUN_MODE}" == "bash" ]; then
	cmd1="/bin/bash"
	docker_args="${docker_args} -i"
elif [ "${EPOXY_RUN_MODE}" == "command" ]; then
	cmd1="${EPOXY_RUN_COMMAND}"
else
	echo "Invalid run mode: ${EPOXY_RUN_MODE}"
	exit -1
fi

container_workspace_directory="/workspace"
if [[ ! -z "${EPOXY_MOUNT_WORKSPACE}" ]]; then
	container_workspace_directory="/workspace_mounted"
	docker_args="${docker_args} -v ${EPOXY_MOUNT_WORKSPACE}:${container_workspace_directory}"
	cmd1="cd ${container_workspace_directory} && ${cmd1}"
fi

if [[ "${EPOXY_CAPSULE_MODE}" == "true" ]]; then
	if [[ ! -z "${EPOXY_CAPSULE_RESULTS_DIRECTORY}" ]]; then
		if [[ ! -z "${EPOXY_MOUNT_WORKSPACE}" ]]; then
			echo "Problem: cannot use capsule results directory together with --mount option"
			exit -1
		fi
		mkdir -p ${EPOXY_CAPSULE_RESULTS_DIRECTORY}
		docker_args="${docker_args} -v ${EPOXY_CAPSULE_RESULTS_DIRECTORY}:${container_workspace_directory}/results"
	fi
else
	cmd1="source activate env1 && ${cmd1}"
fi

cmd2="/bin/bash -c \"${cmd1}\""

cmd3="docker run ${docker_args} ${image_name} ${cmd2}"
echo $cmd3
/bin/bash -c "${cmd3}"
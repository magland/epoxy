#!/bin/bash

set -e

# Make a unique image name and container namem
image_name="epoxy_image_${SESSION_ID}"
container_name="epoxy_container_${SESSION_ID}"

# Some docker tags
docker_args="--name=${container_name} -t"
if [[ ! -z "${PORT}" ]]; then
	# there's a port to bind
	docker_args="-p $PORT:$PORT ${docker_args}"
fi

if [[ ! -z EPOXY_MOUNT_WORKSPACE ]]; then
	docker_args="${docker_args} -v ${SOURCE_DIRECTORY}:/workspace_mount"
	container_workspace_directory="/workspace_mount"
else
	container_workspace_directory="/workspace"
fi


if [ "${EPOXY_RUN_MODE}" == "jupyterlab" ]; then
	cmd1="jupyter lab --ip=0.0.0.0 --port=$PORT --allow-root --no-browser --NotebookApp.token='${EPOXY_JUPYTER_TOKEN}'"
	#cmd1="/bin/bash"
	#docker_args="${docker_args} -i"
elif [ "${EPOXY_RUN_MODE}" == "bash" ]; then
	cmd1="/bin/bash"
	docker_args="${docker_args} -i"
elif [ "${EPOXY_RUN_MODE}" == "command" ]; then
	cmd1="${EPOXY_RUN_COMMAND}"
else
	echo "Invalid run mode: ${EPOXY_RUN_MODE}"
	exit -1
fi


cmd1="cd ${container_workspace_directory} && ${cmd1}"

if [[ "${EPOXY_CAPSULE_MODE}" == "true" ]]; then
	docker_args="${docker_args} -v ${SOURCE_DIRECTORY}/code:${container_workspace_directory}/code"
	docker_args="${docker_args} -v ${SOURCE_DIRECTORY}/environment:${container_workspace_directory}/environment"
	docker_args="${docker_args} -v ${SOURCE_DIRECTORY}/metadata:${container_workspace_directory}/metadata"
	docker_args="${docker_args} -v ${SOURCE_DIRECTORY}/data:${container_workspace_directory}/data"
	if [[ ! -z "${EPOXY_CAPSULE_RESULTS_DIRECTORY}" ]]; then
		mkdir -p ${EPOXY_CAPSULE_RESULTS_DIRECTORY}
		docker_args="${docker_args} -v ${EPOXY_CAPSULE_RESULTS_DIRECTORY}:${container_workspace_directory}/results"
	fi
elif [[ "${EPOXY_HAS_DOCKERFILE}" == "true" ]]; then
	cmd1="${cmd1}"
else
	cmd1="source activate env1 && ${cmd1}"
fi


cmd2="/bin/bash -c \"source ~/.bashrc && ${cmd1}\""

cmd3="docker run ${docker_args} ${image_name} ${cmd2}"
echo $cmd3
/bin/bash -c "${cmd3}"
FROM continuumio/miniconda3:latest

ADD environment.yml /build/environment.yml
RUN conda env create -n env1 -f /build/environment.yml
ENV PATH /opt/conda/envs/env1/bin:$PATH

ADD postBuild /build/postBuild
ADD scripts /working/scripts
WORKDIR /build
RUN bash -c "source activate env1 && /working/scripts/post_build.sh"

ADD epoxy.sh /epoxy/epoxy.sh
RUN bash -c "source activate env1 && bash /epoxy/epoxy.sh"

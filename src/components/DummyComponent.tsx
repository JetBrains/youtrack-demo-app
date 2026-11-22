type DummyComponentProps = {
    data: unknown[],
    config: { name: string }
    width: number
    height: number
}

const DummyComponent = ({ data, config, width, height }: DummyComponentProps) => (
  <svg
    id="dummy"
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
  >
    <g
      transform={`translate(${width/2}, ${height/2})`}
    >
      <text>
        Config: {JSON.stringify(config)}
      </text>
      <text
        transform={`translate(${0}, ${14})`}
        textAnchor="middle"
      >Width: {width} x Height: {height} -- Data: {data.length}</text>
    </g>
  </svg>
)

export default DummyComponent

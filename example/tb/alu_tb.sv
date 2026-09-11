module alu_tb;
  logic [7:0] a, b, y;
  alu dut (.a(a), .b(b), .y(y));
  initial begin
    a = 8'd2; b = 8'd3;
    #1;
    if (y !== 8'd5) $fatal(1, "Unexpected ALU result");
    $display("PASS");
    $finish;
  end
endmodule
